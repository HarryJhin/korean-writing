# 설치

두 가지 방법이 있다. **A. 마켓플레이스(권장)** 또는 **B. 수동 복사**.

> 참고: 현재 Claude Code는 워크플로우를 1급 플러그인 컴포넌트로 배포하지 못한다(plugin.json에 `workflows` 필드 없음, anthropics/claude-code#66032). 그래서 마켓플레이스 설치에서는 SessionStart 훅이 번들된 워크플로우를 `~/.claude/workflows/`로 복사한다 — 문서상 비권장 워크어라운드이며, #66032 머지 시 정규 컴포넌트로 전환한다.

## A. 마켓플레이스 설치 (권장)

```
/plugin marketplace add HarryJhin/korean-docs
/plugin install korean-docs@korean-docs-marketplace
```

설치하면:
- `write-korean-docs` pre-flight 스킬이 등록된다(`korean-docs:write-korean-docs`).
- SessionStart 훅이 워크플로우를 `~/.claude/workflows/`로 복사한다 → **다음 세션부터** `/korean-docs` 슬래시 커맨드가 생긴다.

## B. 수동 복사

```bash
git clone https://github.com/HarryJhin/korean-docs && cd korean-docs
mkdir -p ~/.claude/workflows ~/.claude/skills
cp workflows/korean-docs.js ~/.claude/workflows/
cp -R skills/write-korean-docs ~/.claude/skills/   # 선택: pre-flight 스킬
```

## 실행

설치하면 `/korean-docs` 슬래시 커맨드가 생긴다(`/deep-research`와 동일한 방식). 주제를 인자로 넘긴다:

```
/korean-docs JavaScript Array.prototype.flat() 메서드 레퍼런스
```

독자·톤 등을 지정하려면 JSON으로 넘긴다:

```
/korean-docs {"topic":"...","docType":"reference","audience":"...","tone":"..."}
```

`/workflows` UI에서 선택해 실행해도 된다. pre-flight 스킬을 깔았다면 "한글 레퍼런스 문서 만들어줘" 같은 자연어로도 진입한다(실행 전 파라미터를 묻고 비용을 고지한다).
