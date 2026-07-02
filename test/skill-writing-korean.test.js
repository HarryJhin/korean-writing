import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const skill = readFileSync(new URL('../skills/writing-korean/SKILL.md', import.meta.url), 'utf8')

test('writing-korean: 유효한 프론트매터 (gerund명 + 3인칭 Use when)', () => {
  assert.match(skill, /^---/)
  assert.match(skill, /name:\s*writing-korean/)
  assert.match(skill, /description:\s*Use when/)
})

test('writing-korean: R1~R5 규칙 골격', () => {
  for (const r of ['R1', 'R2', 'R3', 'R4', 'R5']) {
    assert.ok(skill.includes(r), `${r} 섹션 존재`)
  }
})

test('writing-korean: S1 4종을 규칙으로 명시', () => {
  assert.ok(/em dash/i.test(skill), 'em dash 금지')
  assert.ok(skill.includes('이모지'), '이모지 금지')
  assert.ok(skill.includes('세미콜론'), '세미콜론 금지')
  assert.ok(skill.includes('이중 피동'), '이중 피동 금지')
})

test('writing-korean: 본문에 S1 위반이 없다 (자기 규칙 준수)', () => {
  // em dash 문자 자체를 예시로도 싣지 않는다(훅 오탐 방지) — U+2014 표기로 우회
  assert.ok(!skill.includes('—'), 'em dash 리터럴 없음')
  assert.ok(!/;\s*$/m.test(skill), '본문 세미콜론 없음')
})

test('writing-korean: 근거 리포트 링크', () => {
  assert.ok(skill.includes('작문-딥리서치-리포트'), '딥리서치 근거 링크')
})

test('writing-korean: 워크플로우 잔재 없음', () => {
  assert.ok(!skill.includes('/korean-docs'), '워크플로우 커맨드 참조 금지')
  assert.ok(!skill.includes('existingDoc'), '워크플로우 인자 참조 금지')
})

test('writing-korean: 용어 규칙 — 사용자 대면 텍스트에 "산문" 금지', () => {
  assert.ok(!skill.includes('산문'), '"산문" 표현 금지 (도메인 용어는 한국어 글쓰기)')
})
