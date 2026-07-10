import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('plugin.json is valid JSON and names the plugin', () => {
  const p = JSON.parse(readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8'))
  assert.equal(p.name, 'korean-writing')
  assert.equal(p.version, '1.6.0')
  assert.ok(p.description, 'description present')
  // hooks/hooks.json은 기본 위치라 자동 발견된다. plugin.json에 또 선언하면
  // 같은 파일을 두 번 로드해 "Duplicate hooks file" 로드 에러가 난다 → 선언 금지.
  assert.ok(!('hooks' in p), 'hooks must NOT be declared explicitly (auto-discovered)')
})

test('package.json mirrors plugin.json version (SoT invariant)', () => {
  const p = JSON.parse(readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8'))
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(pkg.version, p.version)
  assert.equal(pkg.name, 'korean-writing')
})

test('marketplace.json is valid JSON and lists the plugin without version', () => {
  const m = JSON.parse(readFileSync(new URL('../.claude-plugin/marketplace.json', import.meta.url), 'utf8'))
  assert.equal(m.name, 'korean-writing-marketplace')
  assert.ok(m.owner && Array.isArray(m.plugins))
  const entry = m.plugins.find(p => p.name === 'korean-writing' && p.source === './')
  assert.ok(entry, 'korean-writing entry')
  assert.ok(!('version' in entry), 'marketplace entry must not pin version')
})

test('hooks.json wires PostToolUse(Write|Edit) checker and SessionStart injector', () => {
  const h = JSON.parse(readFileSync(new URL('../hooks/hooks.json', import.meta.url), 'utf8'))
  const post = h.hooks.PostToolUse
  assert.ok(Array.isArray(post) && post[0].matcher === 'Write|Edit', 'PostToolUse matcher')
  assert.ok(JSON.stringify(post).includes('${CLAUDE_PLUGIN_ROOT}/hooks/check-written-file.mjs'))
  const start = h.hooks.SessionStart
  assert.ok(Array.isArray(start), 'SessionStart event')
  assert.ok(JSON.stringify(start).includes('${CLAUDE_PLUGIN_ROOT}/hooks/inject-rules.mjs'))
  assert.ok(!('Stop' in h.hooks), '응답 사후 차단 Stop 훅 없음 (사전 주입으로 대체)')
  assert.ok(!JSON.stringify(h).includes('install-workflow'), '워크플로우 설치 훅 잔재 없음')
})
