import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectS1, countS2, proseScore, stripCode, longSentences } from '../lib/prose-checks.js'

test('detectS1 flags em-dash and emoji', () => {
  const ids = detectS1('이것은 — 삽입구 🚀 입니다').map(x => x.id)
  assert.ok(ids.includes('em-dash'))
  assert.ok(ids.includes('emoji'))
})

test('detectS1 flags double passive', () => {
  assert.ok(detectS1('이 값은 판단되어진다').some(x => x.id === 'double-passive'))
})

test('stripCode removes fenced and inline code', () => {
  const s = stripCode('문장 ```\nconst a=1;\n``` 그리고 `x;` 끝')
  assert.ok(!s.includes('const a'))
  assert.ok(!s.includes('x;'))
})

test('proseScore is clean on natural Korean', () => {
  assert.equal(proseScore('이 함수는 사용자 ID를 받아 이름을 반환한다.').clean, true)
})

test('semicolons inside code are not flagged', () => {
  assert.equal(proseScore('설명입니다.\n```js\nconst a = 1;\n```\n').clean, true)
})

test('countS2 counts translationese markers', () => {
  const c = countS2('데이터를 통해 분석하고 결과에 대해 논의한다')
  assert.ok(c.through >= 1 && c.about >= 1)
})

// ── 이중피동 확장: 신문 말뭉치 빈출형(보여지다·잊혀지다 등 -여/혀/려/겨지다 계열) ──
test('detectS1 flags contracted double passives (보여지다/잊혀지다 family)', () => {
  for (const s of ['그 결과가 보여진다', '이름이 잊혀졌다', '글이 쓰여진 방식', '문이 닫혀질 것이다', '책임이 넘겨진다']) {
    assert.ok(detectS1(s).some(x => x.id === 'double-passive'), `미검출: ${s}`)
  }
})

test('detectS1 does NOT flag the noun 여지 or acceptable single -어지다', () => {
  for (const s of ['선택의 여지가 없다', '여지없이 거절했다', '합의가 이루어졌다', '제품이 만들어진다', '결론이 만져지듯 뚜렷하다']) {
    assert.equal(detectS1(s).some(x => x.id === 'double-passive'), false, `오검출: ${s}`)
  }
})

// ── 만연체: 문장 길이 soft 측정(하드 게이트 아님) ──
test('longSentences flags only sentences over the char threshold', () => {
  const text = '짧은 문장이다. ' + '가'.repeat(120) + '.'
  const r = longSentences(text, { maxChars: 100 })
  assert.equal(r.length, 1)
  assert.ok(r[0].length > 100)
})

test('longSentences ignores code blocks', () => {
  const text = '```\n' + 'x'.repeat(200) + '\n```\n짧다.'
  assert.equal(longSentences(text, { maxChars: 100 }).length, 0)
})

// ── 번역투 S2 확장: 주제격 뒤 쉼표 과다 + -의 남용(연쇄) ──
test('countS2 counts comma-after-topic and genitive chains', () => {
  const c = countS2('그는, 어제, 회사의 정책의 변경을 검토했다')
  assert.ok(c.commaTopic >= 1, '주제격 뒤 쉼표 미검출')
  assert.ok(c.genitive >= 1, '-의 연쇄 미검출')
})
