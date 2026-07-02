import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const SCRIPT = new URL('../hooks/check-response.mjs', import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), 'kw-stop-'))
let seq = 0

function makeTranscript(assistantText) {
  const f = join(dir, `t${seq}.jsonl`)
  const lines = [
    JSON.stringify({ type: 'user', message: { content: [{ type: 'text', text: '질문' }] } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: assistantText }] } }),
  ]
  writeFileSync(f, lines.join('\n') + '\n')
  return f
}

function run(assistantText, opts = {}) {
  seq += 1
  const input = {
    session_id: opts.session_id ?? `s-${process.pid}-${seq}`,
    prompt_id: opts.prompt_id ?? `p-${seq}`,
    transcript_path: opts.transcript_path ?? makeTranscript(assistantText),
  }
  return { input, result: spawnSync('node', [SCRIPT], { input: JSON.stringify(input), encoding: 'utf8' }) }
}

test('한국어 응답에 S1 위반이 있으면 exit 2 + stderr 피드백', () => {
  const text = '이 문제는 다음과 같이 해결되어진다. '.repeat(3)
  const { result } = run(text)
  assert.equal(result.status, 2)
  assert.ok(result.stderr.includes('이중 피동'), '위반 종류 표기')
})

test('같은 session+prompt에서 두 번째 Stop은 통과 (루프 가드)', () => {
  const text = '한국어 응답이다 — 위반 포함. '.repeat(3)
  const first = run(text)
  assert.equal(first.result.status, 2, '1회차 block')
  const second = spawnSync('node', [SCRIPT], { input: JSON.stringify(first.input), encoding: 'utf8' })
  assert.equal(second.status, 0, '2회차 통과')
})

test('clean 한국어 응답은 exit 0', () => {
  const text = '한국어 응답이다. 위반이 없다. 문장을 짧게 끊는다. '.repeat(2)
  assert.equal(run(text).result.status, 0)
})

test('영어 응답은 em dash가 있어도 exit 0 (한글 임계 미달)', () => {
  assert.equal(run('This is an English response — with an em dash.').result.status, 0)
})

test('fail-open: transcript가 없으면 exit 0', () => {
  const { result } = run('무시', { transcript_path: join(dir, 'no-such.jsonl') })
  assert.equal(result.status, 0)
})

test('fail-open: stdin이 JSON이 아니면 exit 0', () => {
  const r = spawnSync('node', [SCRIPT], { input: '{broken', encoding: 'utf8' })
  assert.equal(r.status, 0)
})
