---
name: fixing-korean-text
description: Use when the user wants to fix or polish existing Korean text, removing AI슬롭, 번역투, 이중 피동 from text they already have (pasted text or a .md file). NOT for writing new text from scratch (load writing-korean instead). 트리거 - 한글 교정, AI 냄새 제거, 번역투 고쳐, 한글 다듬어, 문장 자연스럽게.
---

# fixing-korean-text (한국어 텍스트 교정)

이미 존재하는 한국어 텍스트를 교정한다. 입력의 사실·수치·고유명사·코드·인용 표기 `[n]`을
보존하면서 표현만 자연스럽게 다듬는다. 새로 쓰는 글은 `writing-korean` 지침을 따른다.

## 1. 규칙 로드 (SoT)

교정 기준은 이 플러그인의 규칙 SoT다. 먼저 이 스킬의 base directory 기준
`../writing-korean/SKILL.md`를 Read해서 R1~R7 규칙을 로드한다. 규칙을 이 파일에
복제하지 않는다. SoT가 항상 우선한다.

## 2. 입력 감지

- 인자가 존재하는 파일 경로면 파일 모드. 그 파일을 Read한다.
- 그 외(붙여넣기 텍스트·문장)면 텍스트 모드.
- 빈 입력·존재하지 않는 경로면 무엇을 교정할지 되묻고 중단한다(조용한 실패 금지).

## 3. 교정

R1~R7 기준으로 교정본을 만든다. 사실·수치·고유명사·코드 블록·인용 `[n]`은 100% 보존한다.
날조 금지. 근거 없으면 채우지 말고 삭제한다.

교정은 한 번의 마지막 수리가 아니라 재귀 과정이다(Flower & Hayes 1981). 긴 텍스트는
섹션 단위로 교정과 검사를 반복하고, 앞 섹션에서 배운 지적을 뒤 섹션에 바로 적용한다.
"고쳐쓰기가 잘 쓰기의 본질"이라는 정전 원칙(Zinsser, On Writing Well 6판 2001)이
이 절차의 근거다.

## 4. S1 결정론 검증 (Bash 강제, 폐루프)

교정본을 임시 파일에 쓴 뒤 CLI로 S1을 검사한다. node 실행 전 nvm을 로드한다.

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use
node "$CLAUDE_PLUGIN_ROOT/lib/prose-cli.js" <교정본_파일.md>
```

- exit 0 = S1 clean. exit 1 = 위반 있음(stdout JSON의 `s1[]`에 종류·위치).
- 위반이 있으면 해당 패턴을 제거하도록 재교정하고 다시 검사한다(검사-수정-재검사 폐루프).

## 5. 자연스러움 리뷰 + 재교정 (상한 2회)

S1 clean 후 "이 글이 왜 아직도 AI처럼 읽히나"를 스스로 리뷰한다(R2~R4 관점).
지적이 있으면 재교정하고 4의 S1 검사를 다시 통과시킨다.

- 재교정은 최대 2회. 이후에도 잔여 위반이 있으면 "남은 S1 N건: <목록>"으로 보고하고
  사용자에게 판단을 위임한다(무한 재시도 금지).
- 재교정이 사실·인용 `[n]`을 훼손하면 그 재교정을 버리고 직전본을 유지한다.

## 6. 출력

- 텍스트 모드는 교정본을 응답에 표시한다. 파일을 쓰지 않는다.
- 파일 모드는 원본 대비 diff를 보여준다. 원본 덮어쓰기는 사용자가 명시로 확인한 뒤에만
  한다(비가역 변경 보호). 확인 전에는 원본을 건드리지 않는다.

## 7. 감사 모드 (파일 모드 또는 철저한 교정 명시)

파일 모드이거나 사용자가 철저한 감사를 명시하면 단일 패스 대신 순차 리뷰 파이프라인으로
교정한다. 짧은 붙여넣기 텍스트는 앞의 단일 패스를 유지한다(멀티에이전트 남용 금지).

낙관 편향을 끊으려고 R2~R7 판단을 격리 서브에이전트로 넘긴다. 메인은 판정자가 아니라
파이프를 잇고 최종 diff를 사용자에게 넘기는 지휘자다.

### 절차

1. 작업 디렉터리를 만든다. `mktemp -d`로 임시 경로를 얻고 원본을 `v0`로 복사한다.
   원본 파일은 이 절차 동안 건드리지 않는다. 빈 findings 파일도 하나 만든다.
2. 세 리뷰어를 상향식 순서로 하나씩 디스패치한다(병렬 아님, 앞단 수정을 뒷단이 이어받는다).
   각 디스패치 프롬프트에 rules SoT 경로(`$CLAUDE_PLUGIN_ROOT/skills/writing-korean/SKILL.md`),
   입력 작업본 경로, 출력 작업본 경로, findings 파일 경로를 준다.
   - `korean-writing:sentence-reviewer` : v0을 읽고 v1을 쓴다 (R2·R3)
   - `korean-writing:surface-reviewer` : v1을 읽고 v2를 쓴다 (R4·R7)
   - `korean-writing:discourse-reviewer` : v2를 읽고 v3을 쓴다 (R5·R6)
3. v3에 섹션 4의 S1 CLI 검사를 돌려 clean을 확인한다. 위반이 있으면 그 패턴만 제거하고 다시 검사한다.
4. 원본 대비 v3의 diff와 findings 유보 목록을 사용자에게 제시한다. 원본 덮어쓰기는
   사용자가 명시로 확인한 뒤에만 한다.
