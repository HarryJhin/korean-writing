import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { detectS1, stripCode } from '../lib/prose-checks.js'

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

test('planning-korean-writing: v1.4.0 적극 원칙 (응집성 조건부·역피라미드·목표 선설정)', () => {
  assert.ok(/사전지식|배경지식/.test(skill), '독자 지식수준 판정')
  assert.ok(skill.includes('응집성'), '응집성 조절 지시')
  assert.ok(skill.includes('역피라미드'), '정보성 글 핵심 선배치')
  assert.ok(/Flower\s*&\s*Hayes/.test(skill), '목표 네트워크 이론 기반')
  assert.ok(skill.includes('R1~R7'), 'R7 포함 표기')
})

test('planning-korean-writing: 문체 SoT 비복제', () => {
  assert.ok(!skill.includes('| em dash'), '문체 규칙 표 미복제')
  assert.ok(/SoT|단일 출처/.test(skill), 'SoT 참조 명시')
})

test('planning-korean-writing: 파일 산출 금지 (범위 준수)', () => {
  assert.ok(/파일로\s*저장하지\s*않는다/.test(skill), '브리프 파일 저장 금지 (부정 표현) 명시')
})

test('planning-korean-writing: 본문에 S1 위반이 없다 (실 훅 detectS1로 4종 전부)', () => {
  const violations = detectS1(stripCode(skill))
  assert.equal(violations.length, 0, `S1 위반 없음, 발견: ${JSON.stringify(violations)}`)
})

test('planning-korean-writing: 용어 규칙 — "산문" 금지', () => {
  assert.ok(!skill.includes('산문'), '"산문" 표현 금지')
})
