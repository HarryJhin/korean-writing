import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CLI = new URL('../lib/prose-cli.js', import.meta.url).pathname

// exit 0이면 execFileSync가 stdout 반환, 비0이면 throw(e.status/e.stdout에 담김)
function run(args, input) {
  try {
    const stdout = execFileSync('node', [CLI, ...args], { input, encoding: 'utf8' })
    return { code: 0, json: JSON.parse(stdout) }
  } catch (e) {
    return { code: e.status, json: e.stdout ? JSON.parse(e.stdout) : null }
  }
}

test('S1 위반(em dash) → exit 1, clean false, em-dash 검출', () => {
  const r = run(['--stdin'], '이것은 문제다 — 정말로.')
  assert.equal(r.code, 1)
  assert.equal(r.json.clean, false)
  assert.ok(r.json.s1.some(x => x.id === 'em-dash'))
})

test('이중 피동 → double-passive 검출', () => {
  const r = run(['--stdin'], '결과가 화면에 보여진다.')
  assert.equal(r.code, 1)
  assert.ok(r.json.s1.some(x => x.id === 'double-passive'))
})

test('clean 텍스트 → exit 0, clean true, s1 빈 배열', () => {
  const r = run(['--stdin'], '기본값은 0이다. 옵션을 설정한다.')
  assert.equal(r.code, 0)
  assert.equal(r.json.clean, true)
  assert.deepEqual(r.json.s1, [])
})

test('코드블록 내부 위반은 stripCode로 제외', () => {
  const r = run(['--stdin'], '```js\nconst a = b; // 세미콜론과 — em dash\n```\n정상 문장이다.')
  assert.equal(r.code, 0)
  assert.equal(r.json.clean, true)
})

test('파일 모드 == stdin 모드', () => {
  const f = join(tmpdir(), `prose-cli-test-${process.pid}.md`)
  writeFileSync(f, '이것은 문제다 — 정말로.')
  const fileR = run([f])
  const stdinR = run(['--stdin'], '이것은 문제다 — 정말로.')
  assert.equal(fileR.code, stdinR.code)
  assert.deepEqual(fileR.json.s1, stdinR.json.s1)
})

test('인자 없음 → exit 2', () => {
  const r = run([])
  assert.equal(r.code, 2)
})
