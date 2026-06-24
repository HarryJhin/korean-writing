import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupAndCap } from '../lib/assign.js'

const C = (claim, importance, sourceQuality) => ({ claim, quote: 'q', source: 'https://x', importance, sourceQuality })

test('claims를 선언 섹션에 배정하고 미배정은 카운트', () => {
  const claims = [C('a', 'central', 'primary'), C('b', 'supporting', 'blog'), C('c', 'central', 'primary')]
  const assignments = [{ claimId: 0, sectionTitle: 'S1' }, { claimId: 1, sectionTitle: null }, { claimId: 2, sectionTitle: 'S2' }]
  const { bySection, droppedUnassigned } = groupAndCap(claims, assignments, ['S1', 'S2'], 5)
  assert.equal(bySection.get('S1').length, 1)
  assert.equal(bySection.get('S2').length, 1)
  assert.equal(droppedUnassigned, 1)
})

test('선언되지 않은 섹션에 배정된 claim은 미배정 처리', () => {
  const claims = [C('a', 'central', 'primary')]
  const { bySection, droppedUnassigned } = groupAndCap(claims, [{ claimId: 0, sectionTitle: 'GHOST' }], ['S1'], 5)
  assert.equal(bySection.get('S1').length, 0)
  assert.equal(droppedUnassigned, 1)
})

test('섹션당 캡 초과분은 importance/quality 랭킹 후 상위만 유지', () => {
  const claims = [C('low', 'tangential', 'blog'), C('high', 'central', 'primary'), C('mid', 'supporting', 'secondary')]
  const assignments = claims.map((_, i) => ({ claimId: i, sectionTitle: 'S1' }))
  const { bySection, capDropped } = groupAndCap(claims, assignments, ['S1'], 2)
  const kept = bySection.get('S1').map(c => c.claim)
  assert.deepEqual(kept, ['high', 'mid'])
  assert.equal(capDropped, 1)
})

test('빈 섹션도 키로 존재(드롭 안 함)', () => {
  const { bySection } = groupAndCap([], [], ['S1', 'S2'], 5)
  assert.ok(bySection.has('S1') && bySection.has('S2'))
  assert.equal(bySection.get('S1').length, 0)
})

test('중복 claimId 배정은 1회만 반영', () => {
  const claims = [C('a', 'central', 'primary')]
  const { bySection } = groupAndCap(claims, [{ claimId: 0, sectionTitle: 'S1' }, { claimId: 0, sectionTitle: 'S1' }], ['S1'], 5)
  assert.equal(bySection.get('S1').length, 1)
})
