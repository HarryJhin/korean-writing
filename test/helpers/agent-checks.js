import { readFileSync } from 'node:fs'
import { detectS1, stripCode } from '../../lib/prose-checks.js'

export function readAgent(name) {
  return readFileSync(new URL(`../../agents/${name}.md`, import.meta.url), 'utf8')
}

export function assertAgentInvariants(assert, md, { name }) {
  assert.match(md, /^---/, 'frontmatter 시작')
  assert.match(md, new RegExp(`name:\\s*${name}`), 'name 필드')
  assert.match(md, /description:\s*\S/, 'description 필드')
  assert.match(md, /model:\s*sonnet/, 'model sonnet')
  const s1 = detectS1(stripCode(md))
  assert.equal(s1.length, 0, `S1 자기준수 위반: ${JSON.stringify(s1.map(x => x.id))}`)
  assert.ok(md.includes('writing-korean'), '규칙 SoT(writing-korean) 참조')
  assert.ok(!md.includes('| em dash'), 'R1 규칙 표 비복제')
}
