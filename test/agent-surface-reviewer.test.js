import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readAgent, assertAgentInvariants } from './helpers/agent-checks.js'

const md = readAgent('surface-reviewer')

test('surface-reviewer: 공통 불변식', () => {
  assertAgentInvariants(assert, md, { name: 'surface-reviewer' })
})

test('surface-reviewer: 어휘·표층 R4·R7 담당 명시', () => {
  assert.match(md, /R4/, 'R4 명시')
  assert.match(md, /R7/, 'R7 명시')
  assert.ok(/슬롭/.test(md), 'AI슬롭 담당')
  assert.ok(/서식|강조/.test(md), '서식/강조 담당')
})

test('surface-reviewer: findings 유보·타 층위 원문 보존', () => {
  assert.ok(/findings/.test(md), 'findings 유보 규율')
  assert.ok(/보존|무수정|건드리지 않는다/.test(md), '타 층위 원문 보존')
})
