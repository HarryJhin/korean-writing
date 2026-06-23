#!/usr/bin/env bash
# 워크플로우 동기화 훅 (SessionStart).
#
# 배경: 현재 Claude Code는 워크플로우를 1급 플러그인 컴포넌트로 배포하지 못한다
# (plugin.json에 workflows 필드 없음, anthropics/claude-code#66032). 그래서 이 플러그인은
# 번들된 워크플로우를 SessionStart마다 사용자 워크플로우 디렉터리로 복사해 /korean-docs
# 슬래시 커맨드가 생기도록 한다. 이는 문서상 비권장 워크어라운드이며, #66032가 머지되면
# 이 훅을 제거하고 워크플로우를 정규 컴포넌트로 전환한다.
#
# 안전성: 항상 0으로 종료해 세션을 막지 않는다. 내용이 바뀐 경우에만 복사한다.
set -eu

SRC="${CLAUDE_PLUGIN_ROOT:-}/workflows/korean-docs.js"
DEST_DIR="${HOME}/.claude/workflows"
DEST="${DEST_DIR}/korean-docs.js"

[ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "$SRC" ] || exit 0

mkdir -p "$DEST_DIR" 2>/dev/null || exit 0
if ! cmp -s "$SRC" "$DEST" 2>/dev/null; then
  cp "$SRC" "$DEST" 2>/dev/null || exit 0
fi
exit 0
