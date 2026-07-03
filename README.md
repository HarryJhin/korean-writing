# korean-writing

에이전트가 올바른 한국어로 글을 쓰게 만드는 Claude Code 플러그인. 검증된 글쓰기 규칙을
스킬로 제공하고, 기계 판정이 가능한 위반은 훅이 결정론적으로 잡는다.

문서 생성이나 리서치는 이 플러그인의 범위가 아니다. 어떤 도구가 텍스트를 만들든, 그
출력이 한국어다울 것만 책임진다.

## 요구 사항

- 사용: Claude Code (플러그인 마켓플레이스)
- 개발·테스트: Node 24 (`.nvmrc`)

## 설치

터미널에서 Claude Code CLI로 설치한다.

    claude plugin marketplace add HarryJhin/korean-writing
    claude plugin install korean-writing@korean-writing-marketplace

세션 안에서는 같은 명령이 `/plugin marketplace add`, `/plugin install`로도 동작한다.

## 구성

| 구성 요소 | 역할 |
|---|---|
| `writing-korean` 스킬 | 글쓰기 규칙의 단일 출처(SoT). 한국어 글을 쓰기 전에 로드 |
| `fixing-korean-text` 스킬 | 기존 텍스트 교정 절차. 규칙은 writing-korean을 참조 |
| `planning-korean-writing` 스킬 | 쓰기 전 6하원칙 브리프. 목적·독자·핵심 메시지를 확보해 `writing-korean`으로 인계 |
| `references/examples.md` | R2~R6 good과 나쁜 예 대조쌍. 규칙 적용 시 참조 |
| PostToolUse 훅 | 한글 텍스트 파일(.md/.markdown/.txt) 저장 시 S1 위반 검사 |
| Stop 훅 | 한국어 응답에 S1 위반이 있으면 1회 재작성 유도 |

## 규칙

`writing-korean` 스킬이 담는 규칙의 골격이다. 전문은 `skills/writing-korean/SKILL.md`.

| 규칙 | 다루는 것 | 강제 |
|---|---|---|
| R1 절대 금지 | S1 4종(아래) | 훅이 결정론으로 차단 |
| R2 번역투 | 무생물 주어, 수동문 직역, 과잉 명사화, `-의` 연쇄 | 스킬 판단 |
| R3 문장 구조 | 내포·삽입 깊이 | 스킬 판단 |
| R4 AI슬롭 회피 | 상투구, rule of three, 균일 리듬, 불필요 주어 | 스킬 판단 |
| R5 일관성·정직 | 존댓말 등급 일관, 날조 금지 | 스킬 판단 |
| R6 글 구성·전개 | 장면 도입, 소제목 레지스터, 병렬 틀, 비유, 결론 응축 | 스킬 판단 |

### S1: 결정론 검사 대상

em dash(U+2014) 삽입구, 이모지 장식, 본문 속 세미콜론, 이중 피동(`되어진다`·`보여지다` 등).
한 번만 나와도 AI 티가 확정되는 패턴이라 정규식 0/1 게이트로 잡는다(`lib/prose-checks.js`).
번역투·만연체처럼 판단이 필요한 규칙은 스킬로만 다루고 훅으로 강제하지 않는다.

## 동작 방식

- 훅은 fail-open이다. 입력 이상이나 파일 없음이면 조용히 통과해 세션을 막지 않는다.
- 코드블록과 인라인 코드는 검사에서 제외한다.
- 의도된 예외 문서는 파일에 `korean-writing:ignore` 마커를 넣으면 검사에서 빠진다.

## 사용

- 기획부터: 목적·독자가 안 정해진 새 글은 `planning-korean-writing`이 6하원칙 브리프로
  방향을 잡은 뒤 `writing-korean`에 넘긴다. 내용이 이미 명확하면 이 단계를 건너뛴다.
- 새로 쓸 때: "이 내용 한국어로 정리해줘" 같은 요청에서 `writing-korean` 스킬이 규칙을
  로드한다. 명시 호출도 된다.
- 고칠 때: "이 문서 번역투 고쳐줘", "AI 냄새 제거해줘"로 `fixing-korean-text`가 뜬다.
  파일 모드는 diff를 보여주고, 덮어쓰기는 명시 확인 후에만 한다.
- 훅은 설치만 하면 자동이다. 한글 문서를 저장하거나 한국어 응답을 마칠 때 S1을 검사한다.

## 규칙의 근거

규칙은 3표 적대 검증을 통과한 딥리서치 결과에 기반한다.

- [작문 딥리서치 리포트](./docs/작문-딥리서치-리포트.md): Pinker·이태준·Gibson·슬롭
  정량화·번역투 (25개 주장 확정)
- [2차 보강 리포트](./docs/작문-딥리서치-리포트-2차-보강.md): Strunk & White 1차 인용,
  한국어 관계절 실증, 이중 피동 빈도 (24개 확정)

## 개발

    nvm use            # Node 24 (.nvmrc)
    node --test        # 라이브러리·스킬 구조·훅 테스트

규칙 본문은 `skills/writing-korean/SKILL.md` 한 곳에서만 고친다. S1 정규식을 바꾸면
markdown 규칙(R1 표)과 `lib/prose-checks.js`를 함께 맞춘다.

## 버전

권위 버전은 `.claude-plugin/plugin.json`의 `version`이다. `package.json`이 미러링하고,
범프마다 [CHANGELOG.md](./CHANGELOG.md) 항목과 `v{version}` 태그를 남긴다.

## 라이선스

MIT. 문체 규칙의 귀속을 포함한 전체 고지는 [LICENSE](./LICENSE)를 참조한다.
