import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readAgent, assertAgentInvariants } from './helpers/agent-checks.js'

const md = readAgent('sentence-reviewer')

test('sentence-reviewer: 공통 불변식', () => {
  assertAgentInvariants(assert, md, { name: 'sentence-reviewer' })
})

test('sentence-reviewer: 문장 층위 R2·R3 담당 명시', () => {
  assert.match(md, /R2/, 'R2 명시')
  assert.match(md, /R3/, 'R3 명시')
  assert.ok(/번역투/.test(md), '번역투 담당')
  assert.ok(/만연체|문장\s*구조/.test(md), '만연체/문장구조 담당')
})

test('sentence-reviewer: findings 유보·타 층위 원문 보존', () => {
  assert.ok(/findings/.test(md), 'findings 유보 규율')
  assert.ok(/보존|무수정|건드리지 않는다/.test(md), '타 층위 원문 보존')
})
