import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

for (const f of ['fact-verifier', 'prose-editor', 'naturalness-reviewer']) {
  test(`agent ${f} has frontmatter`, () => {
    const t = readFileSync(new URL(`../agents/${f}.md`, import.meta.url), 'utf8')
    assert.match(t, /^---/)
    assert.ok(t.includes(`name: ${f}`), `agent ${f} must declare name: ${f}`)
    assert.match(t, /description:\s*\S+/)
  })
}

test('writing-korean-prose skill is bundled', () => {
  const t = readFileSync(new URL('../skills/writing-korean-prose/SKILL.md', import.meta.url), 'utf8')
  assert.match(t, /name:\s*writing-korean-prose/)
})
