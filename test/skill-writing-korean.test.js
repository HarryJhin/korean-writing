import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const skill = readFileSync(new URL('../skills/writing-korean/SKILL.md', import.meta.url), 'utf8')

test('writing-korean: 유효한 프론트매터 (gerund명 + 3인칭 Use when)', () => {
  assert.match(skill, /^---/)
  assert.match(skill, /name:\s*writing-korean/)
  assert.match(skill, /description:\s*Use when/)
})

test('writing-korean: R1~R7 규칙 골격', () => {
  for (const r of ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']) {
    assert.ok(skill.includes(r), `${r} 섹션 존재`)
  }
})

test('writing-korean: v1.4.0 구성 보강 (주제문·신호 장치·3차 리포트 근거)', () => {
  assert.ok(skill.includes('주제문'), 'R6 주제문 권고')
  assert.ok(/헤딩.*개요.*요약|개요.*요약/.test(skill), 'R6 신호 장치')
  assert.ok(skill.includes('3차-적극원칙'), '3차 리포트 근거 링크')
})

test('writing-korean: v1.3.0 수입 규칙 명시 (연결어미 쉼표·슬롭 어휘군·서식 절제)', () => {
  assert.ok(skill.includes('연결어미'), '연결어미 뒤 쉼표 규칙')
  assert.ok(skill.includes('슬롭 어휘군'), 'R4 슬롭 어휘군 표')
  assert.ok(skill.includes('서식·강조 절제'), 'R7 서식 절제')
  assert.ok(skill.includes('im-not-ai-갭-심사') || skill.includes('im-not-ai 갭 심사'), '심사 문서 근거 링크')
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
