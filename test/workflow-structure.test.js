import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const wfUrl = new URL('../workflows/korean-docs.js', import.meta.url)
const src = readFileSync(wfUrl, 'utf8')

test('workflow body is syntactically valid (workflow-runtime form)', () => {
  // Workflow 스크립트는 `export const meta` + 최상위 await/return을 쓰는데, 이 조합은
  // 순수 `node --check`가 거부한다. export를 떼고 async 함수로 감싸 최상위 await/return을
  // 합법화한 뒤 COMPILE만 한다(실행 없음 — agent() 등은 돌지 않는다).
  const wrapped = '(async function(){\n' + src.replace(/^export\s+/gm, '') + '\n})'
  new vm.Script(wrapped) // SyntaxError 시 throw
})

test('workflow declares meta and 7 phases', () => {
  assert.match(src, /export const meta/)
  for (const p of ['스코프', '리서치', '사실 검증', '초안', '문체 교정', '자연스러움 검증', '조립']) {
    assert.ok(src.includes(p), `phase ${p} missing`)
  }
})

test('workflow is self-contained: no custom agentType, no external skill', () => {
  assert.ok(!/agentType:/.test(src), 'must not reference a custom agentType (fully inline)')
  assert.ok(!/writing-korean-prose/.test(src), 'must not reference an external skill by name')
})

test('workflow inlines the prose-correction rules', () => {
  assert.ok(src.includes('이중 피동'), 'S1 prose rule inlined')
  assert.ok(src.includes('날조 금지'), 'no-fabrication rule inlined')
})

test('workflow has no forbidden runtime APIs', () => {
  assert.ok(!/\bimport\s/.test(src), 'no import')
  assert.ok(!/\brequire\(/.test(src), 'no require')
  assert.ok(!/Date\.now|Math\.random/.test(src), 'no Date.now/Math.random')
})

// ── 닫힌 게이트 회귀 방지 ──

test('gate1: naturalness check is a closed loop (re-verifies after redo)', () => {
  // 재작성본을 검증 없이 반환하면 안 된다 — 루프 상단으로 돌아가 재판정해야 한다.
  assert.match(src, /for\s*\(let round/, 'redo must loop back to re-verify')
  assert.match(src, /MAX_REDO/, 'loop must be bounded to avoid infinite redo')
  assert.match(src, /prose-redo:\$\{r\.section\.title\}#\$\{round\}/, 'redo runs inside the loop')
})

test('gate2: S1 is a deterministic runtime hard gate ANDed with the LLM verdict', () => {
  assert.match(src, /const s1Violations =/, 'inline S1 checker defined (self-contained, no import)')
  assert.match(src, /이중 피동/, 'S1 inline list covers double-passive')
  // 확정 조건은 LLM 판정과 S1 클린이 동시 만족이어야 한다.
  assert.match(src, /review\.pass\s*&&\s*review\.fidelityOk\s*&&\s*s1\.length === 0/, 'S1 ANDed into pass condition')
})

test('gate3: sections with zero verified facts are dropped before drafting', () => {
  assert.match(src, /\.filter\(r => \(r\.facts \|\| \[\]\)\.length > 0\)/, 'empty-fact sections filtered out')
  assert.match(src, /사실 0건으로 드롭된 섹션/, 'drop is logged')
})
