# korean-writing — 작업 지침

에이전트에게 한국어 글쓰기 지침을 제공하는 Claude Code 플러그인. 핵심 산출물은
`skills/writing-korean/SKILL.md`(규칙 SoT), `lib/prose-checks.js`(S1 결정론 검사),
훅 2개(`hooks/check-written-file.mjs`, `hooks/check-response.mjs`).

## 용어
- 사용자 대면 이름·문서에 "산문(prose)" 표현 금지. 도메인 용어는 "한국어 글쓰기"다.
  코드 내부 식별자(`lib/prose-*.js`)는 churn 방지를 위해 유지.

## 규칙 SoT
- 규칙 본문은 `skills/writing-korean/SKILL.md` 한 곳. 교정 스킬·README는 참조만 한다.
- S1은 markdown 규칙(R1 표) ↔ `lib/prose-checks.js` 정규식 2곳 동기화. 한쪽 수정 시 양쪽.
  S2 마커도 규칙 본문(R2·R4) ↔ `S2_MARKERS`가 대응한다. 마커 추가·삭제 시 양쪽과
  `docs/im-not-ai-갭-심사.md` 판정 근거를 함께 갱신.
- `skills/writing-korean/SKILL.md` 본문에 S1 위반 리터럴(em dash 문자 등)을 넣지 마라.
  테스트가 검사하고, 훅이 자기 파일에서 오탐한다. em dash는 "U+2014"로 표기.
- repo의 한국어 문서(README·CHANGELOG 신규 항목 등)도 S1을 자기 준수한다. 역사적
  산출물(리포트 2건, CHANGELOG 과거 항목)만 `korean-writing:ignore` 마커로 예외.

## 훅 원칙
- fail-open: stdin 파싱 실패·파일 없음·transcript 이상이면 exit 0 (세션을 막지 않는다).
- 검사는 S1만. 판단이 필요한 규칙(번역투·만연체)은 훅으로 강제하지 않는다(오탐 노이즈).
- Stop 훅 루프 가드: session_id+prompt_id 마커 파일. 같은 턴 두 번째 Stop은 무조건 통과.
  마커를 못 쓰면 block하지 않는다(가드 없는 강제 금지).
- opt-out: 파일에 `korean-writing:ignore` 마커. 한글 없는 파일·코드 파일은 자동 통과.

## 코드 패턴
- 문서 속 코드 예시는 펜스 블록(```)으로 쓴다. 4칸 들여쓰기 블록은 `stripCode`가
  제외하지 않아 코드 속 세미콜론을 훅이 S1로 오탐한다.
- `/g` 정규식으로 존재 여부 판정 시 `.test()` 금지(`lastIndex` 상태 버그)
  → `(str.match(re) || []).length` 사용.

## 테스트·실행
- `node --test`. 훅 테스트는 spawnSync로 실제 스크립트를 실행해 exit code·stderr를 검증한다.
- node 실행 전 `nvm use`(`.nvmrc` = Node 24). fresh 셸은 PATH에 v22를 잡는다.

## 마켓플레이스·버전 관리
- 버전 불변식: **SoT = `plugin.json`** → `package.json` 미러 → `CHANGELOG.md` 항목(한국어,
  Keep a Changelog) → `v{version}` 태그. `marketplace.json`엔 version 필드를 넣지 않는다
  (plugin.json 값을 조용히 override해 stale 버전을 가린다).
