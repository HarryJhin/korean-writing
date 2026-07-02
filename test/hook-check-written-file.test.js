import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const SCRIPT = new URL('../hooks/check-written-file.mjs', import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), 'kw-hook-'))

function run(filePath) {
  return spawnSync('node', [SCRIPT], {
    input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: filePath } }),
    encoding: 'utf8',
  })
}

test('한글 .md에 S1 위반(em dash)이 있으면 exit 2 + stderr 피드백', () => {
  const f = join(dir, 'bad.md')
  writeFileSync(f, '한국어 문장이다 — 이렇게 끼어든다.')
  const r = run(f)
  assert.equal(r.status, 2)
  assert.ok(r.stderr.includes('em dash'), 'stderr에 위반 종류')
  assert.ok(r.stderr.includes('writing-korean'), '스킬 규칙을 지칭')
})

test('한글 .md가 clean이면 exit 0', () => {
  const f = join(dir, 'clean.md')
  writeFileSync(f, '한국어 문장이다. 위반이 없다.')
  assert.equal(run(f).status, 0)
})

test('한글 없는 영어 .md는 em dash가 있어도 exit 0', () => {
  const f = join(dir, 'english.md')
  writeFileSync(f, 'An English doc — with em dash.')
  assert.equal(run(f).status, 0)
})

test('코드 파일(.js)은 검사하지 않는다', () => {
  const f = join(dir, 'code.js')
  writeFileSync(f, 'const s = "한국어 — 문자열";')
  assert.equal(run(f).status, 0)
})

test('코드 블록 내부 위반은 무시한다 (stripCode)', () => {
  const f = join(dir, 'codeblock.md')
  writeFileSync(f, '한국어 본문이다.\n\n```js\nconst a = 1; // —\n```\n')
  assert.equal(run(f).status, 0)
})

test('korean-writing:ignore 마커 파일은 통과', () => {
  const f = join(dir, 'ignored.md')
  writeFileSync(f, '<!-- korean-writing:ignore -->\n한국어 — 위반이 있어도 통과.')
  assert.equal(run(f).status, 0)
})

test('fail-open: stdin이 JSON이 아니면 exit 0', () => {
  const r = spawnSync('node', [SCRIPT], { input: 'not json', encoding: 'utf8' })
  assert.equal(r.status, 0)
})

test('fail-open: 파일이 없으면 exit 0', () => {
  assert.equal(run(join(dir, 'no-such-file.md')).status, 0)
})
