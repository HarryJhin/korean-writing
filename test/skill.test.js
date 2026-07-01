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

// ── fix-korean-prose (경량 문체 교정 스킬) ──
const prose = readFileSync(new URL('../skills/fix-korean-prose/SKILL.md', import.meta.url), 'utf8')

test('fix-korean-prose: 유효한 프론트매터', () => {
  assert.match(prose, /^---/)
  assert.match(prose, /name:\s*fix-korean-prose/)
  assert.match(prose, /description:\s*\S+/)
})

test('fix-korean-prose: 문서 생성이 아닌 기존 텍스트 교정임을 명시(write-korean-docs와 구분)', () => {
  assert.ok(/문체\s*교정/.test(prose), '문체 교정 목적 명시')
  assert.ok(!prose.includes('/korean-docs'), '무거운 생성 워크플로우를 띄우지 않는다')
})

test('fix-korean-prose: S1을 Bash로 결정론 강제', () => {
  assert.ok(prose.includes('prose-cli.js'), 'CLI 래퍼를 호출한다')
  assert.ok(/CLAUDE_PLUGIN_ROOT/.test(prose), '플러그인 루트 경로로 호출')
  assert.ok(/nvm use/.test(prose), 'node 실행 전 nvm use 규약')
})

test('fix-korean-prose: 출력 정책(텍스트 표시 / 파일 diff·확인 후 덮어쓰기)', () => {
  assert.ok(/diff/i.test(prose), '파일 모드 diff 표시')
  assert.ok(/덮어쓰/.test(prose), '덮어쓰기 명시 확인 정책')
})

test('fix-korean-prose: 사실·인용 보존 규칙 인라인', () => {
  assert.ok(/날조 금지/.test(prose), 'no-fabrication 규칙')
  assert.ok(/이중 피동/.test(prose), 'S1 문체 규칙 인라인')
})
