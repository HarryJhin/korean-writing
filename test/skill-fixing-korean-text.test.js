import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const skill = readFileSync(new URL('../skills/fixing-korean-text/SKILL.md', import.meta.url), 'utf8')

test('fixing-korean-text: 유효한 프론트매터 (gerund명 + 3인칭 Use when)', () => {
  assert.match(skill, /^---/)
  assert.match(skill, /name:\s*fixing-korean-text/)
  assert.match(skill, /description:\s*Use when/)
})

test('fixing-korean-text: 규칙은 SoT 참조 (본문 미복제)', () => {
  assert.ok(skill.includes('../writing-korean/SKILL.md'), '규칙 SoT를 Read로 참조')
  assert.ok(!skill.includes('| em dash'), '규칙 표를 복제하지 않는다')
})

test('fixing-korean-text: S1을 CLI로 결정론 강제 (폐루프)', () => {
  assert.ok(skill.includes('prose-cli.js'), 'CLI 래퍼 호출')
  assert.ok(/CLAUDE_PLUGIN_ROOT/.test(skill), '플러그인 루트 경로')
  assert.ok(/nvm use/.test(skill), 'node 실행 전 nvm use')
  assert.ok(/재검사|다시 검사/.test(skill), '검사-수정-재검사 폐루프')
})

test('fixing-korean-text: 출력 정책 (diff·명시 확인 후 덮어쓰기)', () => {
  assert.ok(/diff/i.test(skill), '파일 모드 diff')
  assert.ok(/덮어쓰/.test(skill), '덮어쓰기 확인 정책')
})

test('fixing-korean-text: 사실 보존·날조 금지', () => {
  assert.ok(/날조 금지/.test(skill), 'no-fabrication')
})

test('fixing-korean-text: 용어 규칙 — "산문" 금지', () => {
  assert.ok(!skill.includes('산문'), '"산문" 표현 금지')
})
