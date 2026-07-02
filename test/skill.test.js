import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const skill = readFileSync(new URL('../skills/write-korean-docs/SKILL.md', import.meta.url), 'utf8')

test('pre-flight skill has valid frontmatter', () => {
  assert.match(skill, /^---/)
  assert.match(skill, /name:\s*write-korean-docs/)
  assert.match(skill, /description:\s*\S+/)
})

test('pre-flight skill stays independent (no personal global config)', () => {
  assert.ok(!/writing-korean-prose/.test(skill), 'must not reference a personal skill')
})

test('pre-flight skill points at the /korean-docs workflow and warns about cost', () => {
  assert.ok(skill.includes('/korean-docs'), 'references the workflow command')
  assert.ok(skill.includes('비용'), 'includes a cost warning')
})

test('pre-flight skill hands off natural language, not a JSON-options form (deep-research style)', () => {
  // 워크플로우는 plain string을 받아 audience/tone을 추론한다 → 사용자에게 JSON 옵션 폼을 강요하지 않는다.
  assert.ok(
    !/\{\s*["']?topic["']?\s*:/.test(skill),
    'must not instruct a JSON-object args handoff like {"topic":...}',
  )
})

test('pre-flight skill documents the edit branch', () => {
  assert.ok(/편집|개정/.test(skill), 'mentions editing/revision')
  assert.ok(skill.includes('existingDoc'), 'explains passing existing doc content as args')
  assert.ok(/덮어쓰|revised|diff/i.test(skill), 'states the no-overwrite output policy')
})
