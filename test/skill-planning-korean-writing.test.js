import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const skill = readFileSync(new URL('../skills/planning-korean-writing/SKILL.md', import.meta.url), 'utf8')

test('planning-korean-writing: 유효한 프론트매터 (gerund명 + 3인칭 Use when)', () => {
  assert.match(skill, /^---/)
  assert.match(skill, /name:\s*planning-korean-writing/)
  assert.match(skill, /description:\s*Use when/)
})

test('planning-korean-writing: 조건부 게이트 (핵심 3항목, 2개 이상 결손)', () => {
  assert.ok(skill.includes('독자'), '독자 항목')
  assert.ok(skill.includes('목적'), '목적 항목')
  assert.ok(skill.includes('핵심 메시지'), '핵심 메시지 항목')
  assert.ok(/2개 이상/.test(skill), '2개 이상 결손 시 질의')
})

test('planning-korean-writing: 6항목 브리프와 R6 연결', () => {
  for (const w of ['누구에게', '왜', '무엇을', '어디에', '어떻게', '언제']) {
    assert.ok(skill.includes(w), `6하 항목 ${w}`)
  }
  assert.ok(/R6/.test(skill), '매체·레지스터가 R6 구동')
})

test('planning-korean-writing: writing-korean으로 인계', () => {
  assert.ok(skill.includes('writing-korean'), '인계 대상 스킬')
})

test('planning-korean-writing: 문체 SoT 비복제', () => {
  assert.ok(!skill.includes('| em dash'), '문체 규칙 표 미복제')
  assert.ok(/SoT|단일 출처/.test(skill), 'SoT 참조 명시')
})

test('planning-korean-writing: 파일 산출 금지 (범위 준수)', () => {
  assert.ok(/파일(로|을)?\s*(저장|산출|쓰지)/.test(skill), '브리프 파일 저장 금지 명시')
})

test('planning-korean-writing: 본문에 S1 위반이 없다 (자기 규칙 준수)', () => {
  assert.ok(!skill.includes('—'), 'em dash 리터럴 없음')
  assert.ok(!/;\s*$/m.test(skill), '본문 세미콜론 없음')
})

test('planning-korean-writing: 용어 규칙 — "산문" 금지', () => {
  assert.ok(!skill.includes('산문'), '"산문" 표현 금지')
})
