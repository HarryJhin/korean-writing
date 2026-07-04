import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readAgent, assertAgentInvariants } from './helpers/agent-checks.js'

const md = readAgent('discourse-reviewer')

test('discourse-reviewer: 공통 불변식', () => {
  assertAgentInvariants(assert, md, { name: 'discourse-reviewer' })
})

test('discourse-reviewer: 담화 층위 R5·R6 담당 명시', () => {
  assert.match(md, /R5/, 'R5 명시')
  assert.match(md, /R6/, 'R6 명시')
  assert.ok(/일관성/.test(md), '일관성 담당')
  assert.ok(/구성|전개/.test(md), '구성/전개 담당')
})

test('discourse-reviewer: 마지막 단계로 전체 일관성 점검', () => {
  assert.ok(/마지막|끝|최종/.test(md), '파이프 마지막 단계')
  assert.ok(/findings/.test(md), 'findings 유보 규율')
  assert.ok(/보존|무수정|건드리지 않는다/.test(md), '타 층위 원문 보존 (siblings parity)')
})
