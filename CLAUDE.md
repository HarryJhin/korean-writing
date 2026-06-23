# korean-docs — 작업 지침

deep-research 오마주 한글 기술문서 생성 Claude Code 플러그인. 핵심 산출물은 코드가 아니라
`workflows/korean-docs.js`(Workflow 오케스트레이션) + `lib/prose-checks.js`(결정론적 문체 검사).

## 워크플로우 파일 제약 (`workflows/korean-docs.js`)
- **단일 파일 자기완결**: SessionStart 훅이 이 파일 하나만 `~/.claude/workflows/`로 복사한다. `lib/` 동반 불가 → `import`/`require` 금지. 공유 로직(S1 패턴 등)은 복제해서 인라인한다.
- **`test/workflow-structure.test.js`가 src 전체를 정규식으로 검사**한다. 주석·문자열에도 `import ` 단어(`/\bimport\s/`), `Date.now`/`Math.random`을 쓰지 마라. 테스트가 코드뿐 아니라 주석까지 본다.
- `lib/prose-checks.js`의 `S1_PATTERNS`와 워크플로우 인라인 `S1_INLINE`은 **동일 패턴을 복제**한 것 — 한쪽 수정 시 양쪽 동기화.

## 품질 게이트 원칙
- 검증 단계는 **닫힌 루프**여야 한다: 검사→수정→**재검사**. 재작성본을 검증 없이 반환하지 마라. `MAX_REDO`로 상한.
- LLM 판정과 결정론적 검사(S1)는 **AND로 묶어** 함께 닫는다.
- 검증된 사실이 0건인 섹션은 **초안 전에 드롭**한다 — 작가에게 빈 껍데기를 넘기면 '출처 필요'만 가득한 산문이 나온다.

## 코드 패턴
- `/g` 정규식으로 존재 여부 판정 시 `.test()` 금지(`lastIndex` 상태 버그) → `(str.match(re) || []).length` 사용.

## 테스트·실행
- `node --test` — 라이브러리·구조 테스트. 워크플로우 e2e는 실제 에이전트 spawn(유료)이라 자동 테스트 밖, 수동 스모크만.
- node 실행 전 `nvm use`(`.nvmrc` = Node 24). fresh 셸은 PATH에 v22를 잡는다.

## 마켓플레이스·버전 관리
- **권위 버전 = `.claude-plugin/plugin.json`의 `version`**. 사용자에게 코드 변경을 도달시키려면 이 값을 SemVer로 범프해야 한다 — 커밋 push만으론 부족(공식 docs: plugins-reference#version-management).
- `marketplace.json` 플러그인 엔트리에 `version`을 **넣지 마라**. plugin.json 값이 조용히 override해서 stale 버전을 가린다(공식 docs: plugin-marketplaces#version-resolution).
- `package.json` `version`은 플러그인 메커니즘과 무관(Node 관례)이나, **항상 `plugin.json`을 미러링**한다(SoT는 plugin.json). 범프는 두 파일을 같은 값으로 함께 올린다 — 한쪽만 올리면 분기가 부채로 남는다.
- 의존성용 git tag가 필요하면 컨벤션 `korean-docs--v{version}`. 범프 커밋에 같은 태그를 단다.
- **버전 범프 시 `CHANGELOG.md`에 항목 추가**(Keep a Changelog 스타일, 한국어). 플러그인 로더가 파싱하진 않으나(스키마에 CHANGELOG 필드 없음) 마켓 사용자·repo 방문자용 릴리스 기록이다. 커밋이 Conventional Commits라 추후 자동 생성으로 승급 가능.

> 버전 관리 불변식: **SoT = `plugin.json`** → `package.json` 미러 → `CHANGELOG.md` 항목 → `korean-docs--v{version}` 태그. `marketplace.json`엔 version 없음. 이 사슬이 어긋나면 stale 배포다.
