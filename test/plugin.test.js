import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'

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

test('hooks.json wires SessionStart to the workflow installer', () => {
  const h = JSON.parse(readFileSync(new URL('../hooks/hooks.json', import.meta.url), 'utf8'))
  const json = JSON.stringify(h)
  assert.ok(json.includes('SessionStart'), 'SessionStart event')
  assert.ok(json.includes('${CLAUDE_PLUGIN_ROOT}/hooks/install-workflow.sh'), 'uses plugin root path')
})

test('workflow installer script is executable', () => {
  const mode = statSync(new URL('../hooks/install-workflow.sh', import.meta.url)).mode
  assert.ok(mode & 0o111, 'install-workflow.sh must be executable')
})
