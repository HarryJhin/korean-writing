# korean-docs

deep-research를 오마주한 한글 기술 레퍼런스 문서(.md) 생성 워크플로우. 주제·소스를 받아 리서치 → 적대적 사실 검증 → 섹션 초안 → 문체 교정(번역투·AI슬롭 제거) → 자연스러움 적대 검증 → 조립의 7페이즈를 거친다. 외부 에이전트·스킬 의존 없는 **단일 자기완결 워크플로우 파일**이다.

## 무엇이 다른가

- im-not-ai(기계적 humanizer)와 달리 **리서치·생성**까지 한다.
- deep-research와 달리 **한국어 문체 품질 게이트**(번역투·AI슬롭 제거, 존댓말 일관성)를 5·6페이즈에 둔다.

## 설치

마켓플레이스(권장):

```
/plugin marketplace add HarryJhin/korean-docs
/plugin install korean-docs@korean-docs-marketplace
```

설치 시 pre-flight 스킬이 등록되고, SessionStart 훅이 워크플로우를 `~/.claude/workflows/`로 복사해 다음 세션부터 `/korean-docs`가 생긴다. (워크플로우는 아직 1급 플러그인 컴포넌트가 아니라 훅으로 설치한다 — anthropics/claude-code#66032. 수동 복사 방법은 [INSTALL.md](./INSTALL.md) 참조.)

## 사용

설치하면 `/korean-docs` 슬래시 커맨드가 자동 생성된다(`/deep-research`와 동일). 주제를 바로 넘긴다:

```
/korean-docs JavaScript Array.prototype.flat() 메서드 레퍼런스
```

독자·톤을 지정하려면 JSON으로:

```
/korean-docs {"topic":"...","docType":"reference","audience":"...","tone":"..."}
```

선택적으로 `skills/write-korean-docs`를 깔면 자연어 발동 + 실행 전 파라미터 수집 + 비용 경고를 받는다.

## 개발

```bash
nvm use            # Node 24 (.nvmrc)
node --test        # 라이브러리·구조 테스트
```

## 수동 스모크 테스트 (e2e)

워크플로우 e2e는 실제 에이전트를 spawn하므로(유료) 자동 테스트가 아니다. 수동 확인:

1. `/korean-docs 예: 어떤 CLI의 명령어 레퍼런스` 실행(설치 시 자동 생성되는 슬래시 커맨드)
2. 반환 `markdown`을 파일(OUT.md)로 저장
3. `node -e "import('./lib/prose-checks.js').then(m => console.log(m.proseScore(require('fs').readFileSync('OUT.md','utf8'))))"` 로 S1 클린 확인
4. 사실 정확성·출처 유효성은 사람이 검수(날조 없는지)

## 범위 (v1)

Diátaxis '레퍼런스' 유형, 단일 .md. 하우투·튜토리얼·설명은 후속.

## 라이선스

MIT. 귀속은 [LICENSE](./LICENSE) 참조.
