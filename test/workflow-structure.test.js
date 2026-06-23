import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const wfUrl = new URL('../workflows/korean-docs.js', import.meta.url)
const src = readFileSync(wfUrl, 'utf8')

test('workflow body is syntactically valid (workflow-runtime form)', () => {
  // Workflow scripts use `export const meta` + top-level await/return, a combo
  // plain `node --check` rejects. Strip `export` and wrap the body in an async
  // function to legalize top-level await/return, then COMPILE only (no execution).
  const wrapped = '(async function(){\n' + src.replace(/^export\s+/gm, '') + '\n})'
  new vm.Script(wrapped) // throws on SyntaxError; does not run agent()/etc.
})
test('workflow declares meta and 7 phases', () => {
  assert.match(src, /export const meta/)
  for (const p of ['스코프','리서치','사실 검증','초안','문체 교정','자연스러움 검증','조립']) {
    assert.ok(src.includes(p), `phase ${p} missing`)
  }
})
test('workflow wires bundled agents', () => {
  assert.ok(src.includes("agentType: 'fact-verifier'"))
  assert.ok(src.includes("agentType: 'prose-editor'"))
  assert.ok(src.includes("agentType: 'naturalness-reviewer'"))
})
test('workflow has no forbidden runtime APIs', () => {
  assert.ok(!/\bimport\s/.test(src), 'no import')
  assert.ok(!/\brequire\(/.test(src), 'no require')
  assert.ok(!/Date\.now|Math\.random/.test(src), 'no Date.now/Math.random')
})
