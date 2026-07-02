import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('plugin.json is valid JSON and names the plugin', () => {
  const p = JSON.parse(readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8'))
  assert.equal(p.name, 'korean-docs')
  assert.ok(p.description, 'description present')
  // hooks/hooks.json은 기본 위치라 자동 발견된다. plugin.json에 또 선언하면
  // 같은 파일을 두 번 로드해 "Duplicate hooks file" 로드 에러가 난다 → 선언 금지.
  assert.ok(!('hooks' in p), 'hooks must NOT be declared explicitly (auto-discovered)')
})

test('marketplace.json is valid JSON and lists the plugin', () => {
  const m = JSON.parse(readFileSync(new URL('../.claude-plugin/marketplace.json', import.meta.url), 'utf8'))
  assert.ok(m.name && m.owner && Array.isArray(m.plugins))
  assert.ok(m.plugins.some(p => p.name === 'korean-docs' && p.source === './'))
})

test('hooks.json wires PostToolUse(Write|Edit) and Stop to the S1 checkers', () => {
  const h = JSON.parse(readFileSync(new URL('../hooks/hooks.json', import.meta.url), 'utf8'))
  const post = h.hooks.PostToolUse
  assert.ok(Array.isArray(post) && post[0].matcher === 'Write|Edit', 'PostToolUse matcher')
  assert.ok(JSON.stringify(post).includes('${CLAUDE_PLUGIN_ROOT}/hooks/check-written-file.mjs'))
  const stop = h.hooks.Stop
  assert.ok(Array.isArray(stop), 'Stop event')
  assert.ok(JSON.stringify(stop).includes('${CLAUDE_PLUGIN_ROOT}/hooks/check-response.mjs'))
  assert.ok(!JSON.stringify(h).includes('install-workflow'), '워크플로우 설치 훅 잔재 없음')
})
