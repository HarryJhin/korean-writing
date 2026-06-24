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
  assert.match(src, /\.filter\(r => r\.facts\.length > 0\)/, 'empty-fact sections filtered after regroup')
  assert.match(src, /사실 0건으로 드롭된 섹션/, 'drop is logged')
})

// ── edit 모드 ──

test('edit mode: accepts existingDoc and derives mode/topic', () => {
  assert.match(src, /existingDoc/, 'existingDoc arg handled')
  assert.match(src, /mode\s*===?\s*['"]edit['"]/, 'edit mode branch present')
  assert.match(src, /extractTitleInline/, 'H1 topic extraction inlined')
})

test('edit mode: ingest helpers are inlined (no lib import)', () => {
  assert.match(src, /splitSectionsInline/, 'section splitter inlined')
  assert.match(src, /parseSourcesInline/, 'source parser inlined')
  assert.ok(!/\bimport\s/.test(src), 'still no import after inlining')
})

test('edit mode: outline reconciles existing structure (fromExisting tag)', () => {
  assert.match(src, /fromExisting/, 'sections carry an optional fromExisting mapping')
  assert.match(src, /드롭|재설계|reconcil/i, 'unmapped existing sections are reconciled/logged')
})

test('edit mode: existing claims are extracted and re-verified (not blind-copied)', () => {
  assert.match(src, /fromExisting/, 'reused sections detected by fromExisting')
  assert.match(src, /extract:/i, 'a claim-extraction agent runs for reused sections')
  assert.match(src, /existingSourceMap/, 'extracted claims resolve their source from the existing source map')
})

test('edit mode: draft seeds reused sections with original prose', () => {
  assert.match(src, /기존 본문|표현·구성|seed/i, 'original prose passed to drafter as a preservation seed')
})

// ── 전역 배리어 재구성 ──

test('global-barrier: fact schema carries ranking metadata', () => {
  assert.match(src, /importance:\s*\{\s*(type:\s*['"]string['"],\s*)?enum:\s*\[['"]central['"]/, 'fact has importance enum')
  assert.match(src, /sourceQuality:\s*\{\s*enum:\s*\[['"]primary['"]/, 'fact has sourceQuality enum')
})

test('global-barrier: verify caps and normURL inlined', () => {
  assert.match(src, /const MAX_VERIFY_TOTAL\s*=\s*\d+/, 'MAX_VERIFY_TOTAL defined')
  assert.match(src, /const VOTES_PER_FACT\s*=\s*\d+/, 'VOTES_PER_FACT defined')
  assert.match(src, /const VERIFY_QUORUM\s*=\s*\d+/, 'VERIFY_QUORUM defined')
  assert.match(src, /const normURL\s*=/, 'normURL inlined')
})

test('global-barrier: research is a barrier that builds a global fact pool', () => {
  assert.match(src, /const researched = await pipeline\(/, 'research still uses pipeline for fan-out')
  assert.match(src, /globalFacts/, 'global fact pool assembled')
  assert.match(src, /sectionTitle/, 'facts tagged with sectionTitle for regrouping')
  assert.doesNotMatch(src, /phase:\s*['"]사실 검증['"][\s\S]{0,400}?return\s*\{\s*section:\s*r\.section/, 'verify no longer nested per-section')
})

test('global-barrier: pool is deduped, ranked, and capped', () => {
  assert.match(src, /rankedFacts/, 'ranked/capped pool produced')
  assert.match(src, /\.slice\(0,\s*MAX_VERIFY_TOTAL\)/, 'capped to MAX_VERIFY_TOTAL')
  assert.match(src, /impRank/, 'importance ranking')
  assert.match(src, /qualRank/, 'source-quality ranking')
})

test('global-barrier: verification is grounded and quorum-gated', () => {
  assert.match(src, /WebFetch/, 'verifier instructed to re-fetch the source')
  assert.match(src, /반증|contradicting/i, 'verifier hunts counter-evidence')
  assert.match(src, /valid\.length\s*>=\s*VERIFY_QUORUM/, 'quorum of valid votes required (abstain handled)')
})

test('resilience: outline null-guarded and empty-result salvage', () => {
  assert.match(src, /if\s*\(!outline[\s\S]{0,80}return/, 'outline null guard returns diagnostic')
  assert.match(src, /ordered\.length === 0[\s\S]{0,200}return/, 'all-dropped salvage path')
})

test('observability: final return reports agentCalls and drop counts', () => {
  assert.match(src, /agentCalls/, 'agent call estimate returned')
  assert.match(src, /stats:\s*\{/, 'stats object in final return')
})

test('global-barrier: end-to-end structural invariants', () => {
  // 검증 호출이 fact 총량이 아니라 캡에 묶인다.
  assert.match(src, /verifyCalls\s*=\s*rankedFacts\.length\s*\*\s*VOTES_PER_FACT/, 'verify calls bounded by cap')
  // 7 phases 유지.
  for (const p of ['스코프', '리서치', '사실 검증', '초안', '문체 교정', '자연스러움 검증', '조립']) {
    assert.ok(src.includes(p), `phase ${p} present`)
  }
  // 자기완결 불변식 재확인.
  assert.ok(!/\bimport\s/.test(src) && !/\brequire\(/.test(src), 'still self-contained')
  assert.ok(!/Date\.now|Math\.random/.test(src), 'no forbidden APIs')
})
