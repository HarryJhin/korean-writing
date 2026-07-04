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

test('fixing-korean-text: v1.4.0 재귀 퇴고 + R1~R7 로드', () => {
  assert.ok(skill.includes('재귀'), '재귀 퇴고 프로세스')
  assert.ok(skill.includes('R1~R7'), 'R7 포함 로드')
  assert.ok(!skill.includes('R1~R5'), '구버전 R1~R5 표기 잔재 없음')
})

test('fixing-korean-text: 용어 규칙 — "산문" 금지', () => {
  assert.ok(!skill.includes('산문'), '"산문" 표현 금지')
})

test('fixing-korean-text: 감사 모드 순차 파이프라인 (3 리뷰어 상향식)', () => {
  assert.ok(/감사 모드/.test(skill), '감사 모드 절차')
  assert.ok(skill.includes('korean-writing:sentence-reviewer'), 'sentence 리뷰어 디스패치')
  assert.ok(skill.includes('korean-writing:surface-reviewer'), 'surface 리뷰어 디스패치')
  assert.ok(skill.includes('korean-writing:discourse-reviewer'), 'discourse 리뷰어 디스패치')
  assert.ok(/병렬 아님|순차/.test(skill), '병렬 아닌 순차')
})

test('fixing-korean-text: 감사 모드 발동 임계값·findings 유보·원본 보존', () => {
  assert.ok(/파일 모드|철저/.test(skill), '발동 임계값')
  assert.ok(/findings/.test(skill), 'findings 유보')
  assert.ok(/건드리지 않는다|무수정|원본/.test(skill), '원본 보존')
})
