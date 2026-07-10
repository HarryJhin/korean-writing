import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { S1_PATTERNS, detectS1, stripCode } from '../lib/prose-checks.js'

const SCRIPT = new URL('../hooks/inject-rules.mjs', import.meta.url).pathname

function run() {
  // SessionStart 훅은 stdin JSON을 받지만 이 스크립트는 무시하고 상수를 print한다.
  return spawnSync('node', [SCRIPT], {
    input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup' }),
    encoding: 'utf8',
  })
}

test('exit 0 + stdout에 R1 규칙을 주입한다', () => {
  const r = run()
  assert.equal(r.status, 0)
  assert.ok(r.stdout.includes('[korean-writing]'), '식별 프리픽스')
})

test('S1_PATTERNS 4종 이름을 모두 담는다 (SoT 파생)', () => {
  const r = run()
  for (const p of S1_PATTERNS) {
    assert.ok(r.stdout.includes(p.name), `주입에 "${p.name}" 포함`)
  }
})

test('최상위 비-S1 신호도 주입한다 (연결어미 쉼표·에 의해·할 수 있다·결산 상투구)', () => {
  const out = run().stdout
  for (const anchor of ['연결어미', '에 의해', '할 수 있다', '결론적으로']) {
    assert.ok(out.includes(anchor), `비-S1 신호 "${anchor}" 포함`)
  }
})

test('주입 텍스트 자체가 S1을 준수한다 (자기 위반 없음)', () => {
  const violations = detectS1(stripCode(run().stdout))
  assert.equal(violations.length, 0, `주입 텍스트에 S1 위반: ${JSON.stringify(violations)}`)
})
