# Changelog

이 프로젝트의 주요 변경 사항을 기록한다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르고,
버전 체계는 [SemVer](https://semver.org/lang/ko/)를 따른다.

권위 버전은 `.claude-plugin/plugin.json`의 `version`이며, `package.json`이 이를 미러링한다.
버전을 범프할 때마다 이 파일에 항목을 추가한다.

## [Unreleased]

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

[Unreleased]: https://github.com/HarryJhin/korean-docs/compare/korean-docs--v0.1.2...HEAD
[0.1.2]: https://github.com/HarryJhin/korean-docs/compare/korean-docs--v0.1.1...korean-docs--v0.1.2
[0.1.1]: https://github.com/HarryJhin/korean-docs/compare/korean-docs--v0.1.0...korean-docs--v0.1.1
[0.1.0]: https://github.com/HarryJhin/korean-docs/releases/tag/korean-docs--v0.1.0
