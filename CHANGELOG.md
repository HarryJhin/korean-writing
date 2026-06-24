# Changelog

이 프로젝트의 주요 변경 사항을 기록한다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르고,
버전 체계는 [SemVer](https://semver.org/lang/ko/)를 따른다.

권위 버전은 `.claude-plugin/plugin.json`의 `version`이며, `package.json`이 이를 미러링한다.
버전을 범프할 때마다 이 파일에 항목을 추가한다.

## [Unreleased]

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

[Unreleased]: https://github.com/HarryJhin/korean-docs/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/HarryJhin/korean-docs/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/HarryJhin/korean-docs/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/HarryJhin/korean-docs/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/HarryJhin/korean-docs/releases/tag/v0.1.0
