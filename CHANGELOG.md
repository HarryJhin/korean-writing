# Changelog

<!-- korean-writing:ignore -->

이 프로젝트의 주요 변경 사항을 기록한다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르고,
버전 체계는 [SemVer](https://semver.org/lang/ko/)를 따른다.

권위 버전은 `.claude-plugin/plugin.json`의 `version`이며, `package.json`이 이를 미러링한다.
버전을 범프할 때마다 이 파일에 항목을 추가한다.

## [Unreleased]

### Added
- README에 `업데이트` 섹션. `marketplace update` + `/reload-plugins` 흐름과, add는
  repo 이름·update는 마켓플레이스 이름으로 부르는 인자 차이를 안내한다.

## [1.6.0] - 2026-07-10

### Changed
- 응답 품질을 지키는 방식을 사후 차단에서 사전 주입으로 바꿨다. 파일 저장물은 그대로
  사후 검사·교정하되(PostToolUse), 응답은 세션 시작 때 규칙을 넣어 처음부터 안 쓰도록
  유도한다. 나간 응답은 되돌릴 수 없어 사후 차단의 실익이 정정 턴 추가에 그쳤다.

### Added
- SessionStart 훅(`inject-rules.mjs`). 세션 시작(startup·resume·clear·compact)마다
  글쓰기 규칙을 컨텍스트에 주입한다. R1(S1) 목록은 규칙 SoT인 `S1_PATTERNS`에서 파생하고,
  빈발하는 비-S1 신호(연결어미 뒤 쉼표·에의해류 남용·할 수 있다 남발·결산 상투구)를 함께
  넣는다. 주입은 게이트가 아니라 오탐 비용이 없어 S1을 넘어 방어한다. 스킬이 로드되지 않는
  기술 세션에서도 세션 무관으로 작동한다.

### Removed
- Stop 훅(`check-response.mjs`)과 그 테스트. 한국어 응답의 S1 위반 시 exit 2로 정지를
  1회 차단하던 방식이다. 이미 표시된 응답을 지우지 못하고 재작성 턴만 붙이던 한계로 뺐다.

## [1.5.0] - 2026-07-04

### Added
- 교정 감사 라우팅. `agents/`에 언어 층위별 리뷰어 3종(sentence·surface·discourse)을
  번들한다. 각 리뷰어는 격리 컨텍스트에서 자기 층위 규칙만 독립 판단해, 글을 쥔 메인의
  낙관 편향을 끊는다. 근거는 다른 세션의 subagent-driven 실측(독립 리뷰어가 자기검토였다면
  통과됐을 실질 결함을 반복 검출).
- `fixing-korean-text`에 감사 모드. 파일 모드나 철저한 교정 명시 시 세 리뷰어를 상향식
  순차 파이프라인(sentence → surface → discourse)으로 디스패치하고, 원본 무수정과
  findings 유보를 규율로 둔다. 짧은 텍스트는 단일 패스를 유지한다.

## [1.4.0] - 2026-07-03

### Added
- 3차 딥리서치 리포트(`docs/작문-딥리서치-리포트-3차-적극원칙.md`). 좋은 글을 만드는
  적극 원칙 33개 주장을 3표 적대 검증으로 확정한다(기각 3건 포함). 1·2차에서 두 번
  실패한 Zinsser 원문 인용 7건을 판본·쪽 특정으로 해소하고, 한국어 쓰기 평가 연구
  3건(이은하 2015, 조남민 2012, 김병길 2009)을 서지 특정으로 확보한다.
- R6에 구성 권고 2항: 문단 하나에 화제 하나와 앞쪽 주제문(관행 30~55%를 명시해 권고로
  한정), 긴 문서의 헤딩·개요·요약 신호 장치.
- planning-korean-writing에 적극 원칙 3항: 독자 사전지식 수준에 따른 응집성 조절
  (McNamara 조건부), 정보성 글의 핵심 선배치(역피라미드), 브리프의 이론 기반
  (Flower & Hayes 목표 네트워크).
- fixing-korean-text에 재귀 퇴고 프로세스 문장과 Zinsser 퇴고 정전 각주.

### Fixed
- planning·fixing 스킬의 규칙 범위 표기를 R1~R7로 갱신 (v1.3.0 동기화 누락).
- fixing-korean-text의 nvm 명령 예시를 펜스 코드 블록으로 전환. 들여쓰기 블록은
  `stripCode`가 제외하지 않아 코드 속 세미콜론을 훅이 S1로 오탐했다.

## [1.3.0] - 2026-07-03

### Added
- R7 서식·강조 절제 규칙 신설(볼드·따옴표·괄호 병기·숫자 인덱싱·콜론 부제 헤딩·헤딩
  안내문·불릿 남용). 서술형 글 기준이고 레퍼런스 문서의 목록·표는 예외로 명시한다.
- R4에 슬롭 어휘군 표 9종(결산 상투구, 의의 과장, hype 수식, 열거 도입, 변환 공식,
  결말 공식, 의인화 주어, 메타 진입, 균형 상투구)과 형식명사·문두 접속사·이중 완곡·
  종결어미 반복·수식 중복 항목을 추가한다.
- R2에 번역투 마커 표(have 직역, 자동 피동, 이중 조사, 대명사 직역, 명사 나열)와
  연결어미 뒤 쉼표 규칙을 추가한다. 연결어미 뒤 쉼표는 KatFishNet(ACL 2025) 1차
  확인 수치(에세이 인간 4.10% vs LLM 19.83%)를 인용한다.
- R3에 단문 일변도·쉼표 긴 절 사슬 항목을 추가한다.
- S2 밀도 마커 4종 신설: `connectiveComma`, `haveAux`, `doubleParticle`, `conclusive`.
  게이트가 아니라 카운트만 한다(S1 훅 동작 불변).
- im-not-ai taxonomy 갭 심사 문서(`docs/im-not-ai-갭-심사.md`). 수입/커버됨/배제/보류
  판정과 1차 검증 노트(KatFishNet 확인 3건, 원본의 "KatFish 검증 lexicon" 딱지 반박,
  어절 아닌 형태소 단위로 교정)를 기록한다.

### Changed
- `references/examples.md`에 R2 신규 마커·R3 단문 일변도·R4 어휘군·R7 서식 예시를 보강한다.
- NOTICE.md의 im-not-ai 귀속 범위에 v1.3.0 수입분(어휘군·패턴 선정)을 명시한다.

## [1.2.0] - 2026-07-03

### Added
- `planning-korean-writing` 스킬. 새 한국어 글을 쓰기 전 6하원칙 브리프로 내용과 방향을
  확보하고 `writing-korean`으로 인계한다. 조건부 게이트(핵심 3항목 중 2개 이상 결손 시만
  질의)라 이미 내용이 충분한 요청에는 마찰을 주지 않는다. 브리프의 매체·레지스터 항목이
  R6 구성 규칙을 구동한다. 판단 규칙이라 훅으로 강제하지 않고, 브리프를 파일로 저장하지
  않는다(범위 선언 준수).

## [1.1.0] - 2026-07-02

### Added
- `writing-korean` R6 (글 구성·전개) 판단 규칙. 한국어 기술 글을 레지스터별로 조사해
  추린 구성 규칙이다. 장면 도입, 소제목 레지스터 맞춤(설득=질문형·레퍼런스=명사구),
  병렬 항목 동일 틀, 비유, 열거 개수, 결론 응축, 매체 관용구 복제 금지. 훅으로 강제하지
  않는 판단 규칙이라 `lib/prose-checks.js` 동기화 대상이 아니다.
- `skills/writing-korean/references/examples.md` 예시 뱅크. R2~R6의 good과 나쁜 예
  대조쌍을 담아 SKILL.md에서 참조한다(progressive disclosure). 예시는 특정 매체 문장을
  복제하지 않고 패턴을 드러내도록 새로 썼다.

### Fixed
- `SKILL.md` R1 표의 이중 피동 예시를 인라인 코드로 감쌌다. 평문 리터럴이 자기 파일의
  S1 훅과 자기검증 테스트를 red로 만들던 문제를 해소했다(규칙 내용은 불변, 표현만 조정).

## [1.0.0] - 2026-07-02

### Changed
- **정체성 피벗: 문서 생성 파이프라인 → 한국어 글쓰기 지침 플러그인.** "문서 생성은
  deep-research로 충분하다. 한국어 답변 생성을 지침(스킬·훅)으로 제어하는 게 맞다"는
  리뷰를 수용했다. 플러그인·repo 이름을 `korean-writing`으로 변경.
- 스킬 개명·재구성: `fix-korean-prose` → `fixing-korean-text` (공식 gerund 네이밍,
  "산문" 용어 제거). 규칙 본문은 신설 `writing-korean`으로 이동하고 교정 스킬은
  절차만 남김 (규칙 SoT 단일화, 복제 동기화 지점 3곳 → 2곳).

### Added
- `writing-korean` 지침 스킬: 한국어 글쓰기 규칙 SoT (R1 절대 금지 S1, R2 번역투,
  R3 문장 구조, R4 슬롭 회피, R5 일관성·정직. 3표 적대 검증 딥리서치 근거 부기).
- PostToolUse 훅(`check-written-file.mjs`): 한글 텍스트 파일(.md/.markdown/.txt) 저장 시
  S1 결정론 검사, 위반 피드백. `korean-writing:ignore` 마커로 파일 단위 opt-out.
- Stop 훅(`check-response.mjs`): 한국어 응답(한글 20자 이상)의 S1 위반 시 1회 재작성
  유도. session+prompt 마커 파일로 무한 루프 방지.
- 규칙 근거 리포트 2건을 repo에 포함 (`docs/작문-딥리서치-리포트*.md`).

### Removed
- `/korean-docs` 워크플로우(생성·편집 파이프라인)와 `write-korean-docs` pre-flight 스킬.
- SessionStart 워크플로우 설치 훅(#66032 워크어라운드). 워크플로우 소멸로 불필요.
- `lib/assign.js`, `lib/ingest.js` (워크플로우 전용).
- INSTALL.md. 표준 플러그인 설치로 단순해져 README로 통합.

### Migration
- 기존 korean-docs 설치자는 재설치가 필요하다:
  `claude plugin marketplace add HarryJhin/korean-writing` 후
  `claude plugin install korean-writing@korean-writing-marketplace`.
  (구 마켓은 `claude plugin marketplace rm korean-docs-marketplace`로 제거)
- `~/.claude/workflows/korean-docs.js`는 더 이상 관리되지 않는다. 수동 삭제를 권장한다.

## [0.5.0] - 2026-06-25

### Changed
- **검증 구조를 전역 캡(push) → claim 선언-섹션 배정 후 per-section 검증(pull 수확)으로 재설계**: 전역 `MAX_VERIFY_TOTAL(13)` 단일 캡이 8섹션을 두고 *전역* 랭킹 경쟁시켜 상위 1~2섹션이 검증 슬롯을 독식하고 나머지 섹션이 0건으로 굶던 구조를 제거. 이제 claim을 먼저 선언 섹션에 배정한 뒤 섹션마다 독립적으로 `MAX_VERIFY_PER_SECTION(5)`까지 검증한다 — 섹션이 서로의 검증 예산을 못 뺏는다. 실측 붕괴(AWS WAF 주제: 8섹션 → 검증 후 2섹션)의 근본 원인(섹션 기아 → 게이트3 드롭) 차단.
- **딥리서치식 전역 수확 단계 도입**: 주제 전체에서 검색 앵글(`MAX_SEARCH_ANGLES(8)`)을 도출해 병렬 검색 → 상위 소스 fetch(`MAX_FETCH(15)`)로 claim을 한 풀(`allClaims`)에 평탄화한 뒤, 배정 단계가 선언 섹션으로 분배한다. 기존 섹션-로컬 리서치를 대체.

### Added
- **Salvage 단계**: 배정·검증 후에도 0건인 섹션은 그 섹션 주제로 검색+fetch 1회 재시도 후 재검증한다(`MAX_SALVAGE_FETCH(5)`). 그래도 0건이면 섹션을 드롭하지 않고 제목 + "검증된 출처를 확보하지 못해" caveat 스텁으로 골격을 보존한다 — 빈 껍데기 드롭으로 인한 문서 붕괴를 막는다.
- `lib/assign.js` — claim→섹션 결정론적 배정·캡 함수 + 단위 테스트.
- `stats`에 `searchAngles`·`fetched`·`harvestedClaims`·`assignedDropped`·`salvageFired`·`salvageRecovered`·`caveatSections`를 노출(pull 수확·배정·salvage 관측).

### Fixed
- `AGENTS_MAX` 닫힌-형식 천장에 angle-derivation 호출 누락(off-by-one) 보정 — 천장이 실제 최악 호출 수를 엄밀히 상회하도록.

## [0.4.0] - 2026-06-24

### Changed
- **모든 fan-out 차원에 닫힌-형식 캡 도입(deep-research식)**: `MAX_SECTIONS(8)`로 아웃라인 섹션 수를 잘라, 섹션 차원이 리서치·초안·문체·자연스러움을 무제한 곱하던 구조를 제거. 최악 에이전트 수가 입력(섹션·사실 수)과 무관하게 `AGENTS_MAX` 상수로 고정된다(≈96). 실측 폭주(편집 모드 1회에 862 에이전트·15.5M 토큰·서버 레이트리밋 819건)의 근본 원인을 차단.
- **검증을 인용문 기반으로 전환**: 검증마다 출처 전문을 `WebFetch`로 재페치하던 것을 제거하고, 리서치 단계가 추출한 근거 인용문(`quote`)으로 판정하며 의심 시에만 `WebSearch`로 반증을 찾는다. 검증 배리어의 동시 풀페이지 페치가 서버 레이트리밋을 트립시키고 재시도 폭주로 번지던 경로를 끊는다.
- **검증 캡 조정**: `MAX_VERIFY_TOTAL` 30→13(검증 호출 ≈39로 축소). 다수결 견고성을 위해 `VOTES_PER_FACT(3)`·`VERIFY_QUORUM(2)`는 유지. `MAX_REDO` 2→1.
- **단계별 모델 티어링**: 전 서브에이전트를 세션 모델(Opus[1m], 최고가)로 돌리던 것을 분리 — outline·자연스러움 리뷰=Opus, 리서치·추출·검증·초안·문체 교정·재작성=Sonnet. 회당 토큰 비용을 크게 낮춘다. (초기 스모크에서 문체 교정을 Haiku로 내렸더니 긴 지시+내장 문서에서 이탈해 본문을 영어 거부문으로 날리는 사고가 나, 교정 단계 하한을 Sonnet으로 상향.)

### Fixed
- **인용 보존 가드(모델 무관 방어층)**: 문체 교정·재작성 에이전트가 지시를 이탈해 본문(과 인용 `[n]`)을 메타·거부문으로 대체하면, 초안 대비 인용 수가 절반 이하로 붕괴한 것을 감지해 초안으로 폴백한다. 재작성이 인용을 줄이면 폐기하고 직전본을 유지하며, 게이트 미통과 salvage도 붕괴 시 마지막 교정본 대신 초안을 반환한다. 스모크에서 드러난 "섹션 본문이 프로젝트 상태 횡설수설로 오염" 결함을 차단.

### Added
- `quote` 필드를 `FACT_SCHEMA`에 추가(검증 grounding 근거). 편집 모드에서 추출된 기존 주장은 `quote=''`로 두어 검증자가 `WebSearch`로 대체 확인.
- `stats`에 `agentsMax`·`caps`·`models`를 노출해 닫힌-형식 천장과 적용 캡·모델 티어를 관측 가능하게.

## [0.3.0] - 2026-06-24

### Changed
- 사실 검증을 섹션-로컬 파이프라인에서 전역 배리어로 재구성(deep-research harness 원리). 리서치 후 전 섹션 fact를 전역 풀로 모아 importance·sourceQuality로 랭킹한 뒤 상위 30건(`MAX_VERIFY_TOTAL`)만 검증한다. 검증 서브에이전트 호출이 fact 총량과 무관하게 `30 × VOTES_PER_FACT(3) = 90`으로 상한된다(이전엔 섹션 수 × 섹션당 사실 수에 비례해 무제한 팽창, 런타임 제약 도달).
- 검증자에 출처 URL을 `WebFetch`로 직접 재조회하고 의심 시 `WebSearch`로 반증을 찾도록 지시(이전엔 주장·출처 문자열만 전달, 도구 재조회 지시 없음 — 환각 검증 위험).
- 검증 정족수에 abstain(실패·기권 표)을 명시 처리: 유효표와 verified가 모두 `VERIFY_QUORUM(2)` 이상이어야 통과(과다 abstain → 통과 불가).

### Added
- 전역 출처/사실 dedup: `normURL`(www·trailing slash 정규화) 기반 출처 중복 통합 + `(정규화 출처 + 정규화 주장)` 키 결정론적 사실 중복 제거. fact에 `sourceQuality`(primary/secondary/blog/forum/unreliable) 등급 부여.
- `agent()` null 반환(user-skip/에러) 가드를 outline·draft·prose·review 전 지점에 추가. 확정 사실이 있는 섹션이 0개면 빈 문서 대신 진단 객체를 반환한다.
- 최종 반환 `stats`에 `agentCalls` 추정치와 dedup/캡/드롭 카운트 추가(폭발을 사전 노출).

## [0.2.0] - 2026-06-24

### Added
- 편집 모드: 기존 한글 기술 레퍼런스 `.md`를 받아 구조를 재설계하고 검증 통과 내용만 보존해 개정본 생성. `existingDoc` args로 진입, topic 미지정 시 H1에서 추출.
- `lib/ingest.js`: 기존 문서를 에이전트 없이 파싱하는 결정론 함수(섹션 분할·출처 번호 파싱·H1 추출). 워크플로우에 자기완결로 인라인 복제.

### Changed
- `write-korean-docs` 스킬에 편집 분기 + 원본 자동 덮어쓰기 금지 출력 정책 추가.

## [0.1.4] - 2026-06-24

### Added
- 이중 피동 결정론 검사(S1) 확장 — 빈출 축약형 `보여지다·잊혀지다·쓰여지다·닫혀지다·넘겨지다` 등 `-여/혀/려/겨 + 지/진/졌/질/져` 계열 검출(기존엔 `되어진다/지게 된다`만). 어간 한글 1자 선행을 요구해 명사 '여지(餘地)'와 단일 `-어지다`(이루어지다/만들어지다) 오검출 방지
- 만연체 soft 측정 `longSentences()` — 문장 분할 후 임계 글자수 초과 문장 반환. 하드 게이트가 아닌 참고 지표("길수록 어렵다"는 단조 상관이 실증에서 반박돼 0/1 판정에 쓰지 않음)
- 번역투 밀도 마커(S2) 2종 — 일본어식 쉼표 과다(주제격 `는/은/도` 뒤 쉼표), 관형격 `-의` 연쇄 남용

### Changed
- `PROSE_RULES`(문체 교정 LLM 가이드)에 만연체·인지부하·쉼표/`-의` 번역투 지침 추가 — 핵어–의존어 거리와 내포 깊이를 줄이도록 안내
- `lib/prose-checks.js`의 `S1_PATTERNS`와 워크플로우 인라인 `S1_INLINE` 이중 피동 패턴을 동일하게 동기화

> 근거: 한국어 작문 다출처 딥리서치(신문 말뭉치 이중피동 빈도, Gibson DLT 처리 비용, 일·영 번역투 연구). 한자어 남용 검사는 LLM이 남발하지 않아 제외.

## [0.1.3] - 2026-06-24

### Changed
- `write-korean-docs` pre-flight 스킬을 `/deep-research`식 대화형 진입으로 전환
  - JSON 옵션 폼(`{"topic":...,"audience":...}`) 핸드오프 제거 → 독자·톤을 주제 문장에 녹인 **자연어 문자열 한 줄**로 워크플로우에 전달(워크플로우 아웃라인 단계가 추출·추론)
  - 진입 시 5필드 일괄 수집 대신 **주제 하나만 확정**, 모호할 때만 한두 가지 되물음
  - `README.md`·`INSTALL.md`의 JSON 예시를 자연어 예시로 교체
- 워크플로우 코드 변경 없음 — `korean-docs.js`는 이미 plain string args를 수용

### Added
- pre-flight 계약 회귀 방지 테스트(`test/skill.test.js`) — JSON 객체 핸드오프 지시 시 실패

## [0.1.2] - 2026-06-23

### Added
- 문서 생성 품질 게이트 3종
  - 게이트1(폐루프): 자연스러움 검증을 검사→수정→**재검사** 루프로, `MAX_REDO`로 상한
  - 게이트2(하드게이트): 인라인 S1 결정론 검사(em dash·이모지·세미콜론·이중피동)를 LLM 판정과 AND로 묶어 함께 확정
  - 게이트3(빈 섹션 드롭): 검증된 사실이 0건인 섹션을 초안 전에 제거
- 각 게이트 회귀 방지 테스트(`test/workflow-structure.test.js`)

### Changed
- 버전 관리 불변식화: `plugin.json`을 단일 진실원천(SoT)으로, `package.json`은 미러로 명문화
- `CLAUDE.md` 게이트3 원칙·버전 관리 규율 동기화

## [0.1.1] - 2026-06-23

### Fixed
- 중복 hooks 로드 에러 해결 — `plugin.json`의 명시적 `hooks` 필드 제거
- 위 수정이 사용자 캐시에 도달하도록 버전 범프(코드 변경은 버전 범프 없이는 전파되지 않음)

## [0.1.0] - 2026-06-23

### Added
- 최초 릴리스: 마켓플레이스 플러그인 패키징(manifest + SessionStart 워크플로우 설치 훅)
- `/korean-docs` 워크플로우 — 리서치·사실검증·문체교정·자연스러움 검증 파이프라인
- `write-korean-docs` pre-flight 스킬(트리거·비용 경고)

[Unreleased]: https://github.com/HarryJhin/korean-writing/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/HarryJhin/korean-writing/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/HarryJhin/korean-writing/compare/v0.5.0...v1.0.0
[0.1.3]: https://github.com/HarryJhin/korean-docs/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/HarryJhin/korean-docs/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/HarryJhin/korean-docs/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/HarryJhin/korean-docs/releases/tag/v0.1.0
