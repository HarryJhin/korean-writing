// S1(결정적): 한 번만 나와도 AI 티가 확정되는 패턴. 코드 제외한 산문에만 적용.
export const S1_PATTERNS = [
  { id: 'em-dash', name: 'em dash 삽입구', regex: /—/g },
  { id: 'emoji', name: '이모지 장식', regex: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu },
  { id: 'semicolon', name: '세미콜론(산문 부적합)', regex: /;/g },
  // 되어진다/지게 된다 + 빈출 축약형(보여지다·잊혀지다·쓰여지다…): 피동접미사 이/히/리/기가
  // -어지-와 축약돼 여/혀/려/겨로 표면화한 뒤 지/진/졌/질/져로 활용한다. 어간 한글 1자를
  // 앞에 요구해 명사 '여지(餘地)'·단일 -어지다(이루어지다/만들어지다)의 오검출을 막는다.
  { id: 'double-passive', name: '이중 피동(되어진다/보여지다 등)', regex: /(되어[지진]|지게\s*된|[가-힣](여|혀|려|겨)(지|진|졌|질|져))/g },
]

// S2(밀도): 1~2회는 자연스러우나 3회+ 누적 시 번역투.
export const S2_MARKERS = [
  { id: 'about', regex: /에\s*대(?:해서?|하여)/g },
  { id: 'through', regex: /(?:을|를)\s*통(?:해|하여)/g },
  { id: 'byPassive', regex: /에\s*의해/g },
  { id: 'can', regex: /\s수\s*있/g },
  // 일본어식 쉼표 과다(주제격 '는/은/도' 뒤 쉼표) + 관형격 '-의' 연쇄 남용.
  { id: 'commaTopic', regex: /(는|은|도)\s*,/g },
  { id: 'genitive', regex: /[가-힣]+의\s+[가-힣]+의/g },
]

export function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
}

export function detectS1(text) {
  return S1_PATTERNS.map(p => {
    const matches = [...text.matchAll(p.regex)].map(m => ({ index: m.index, text: m[0] }))
    return { id: p.id, name: p.name, count: matches.length, matches }
  }).filter(r => r.count > 0)
}

export function countS2(text) {
  const counts = {}
  for (const m of S2_MARKERS) counts[m.id] = [...text.matchAll(m.regex)].length
  return counts
}

// 만연체 soft 측정: 문장 분할 후 임계 글자수 초과 문장만 반환한다. 하드 게이트가 아니다 —
// "길수록 어렵다"는 단조 상관은 실증에서 반박됐으므로 0/1 판정이 아닌 참고 지표로만 쓴다.
export function longSentences(text, { maxChars = 90 } = {}) {
  const prose = stripCode(text)
  return prose
    .split(/(?<=[.!?。])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s.length > maxChars)
    .map(s => ({ sentence: s, length: s.length }))
}

export function proseScore(text) {
  const prose = stripCode(text)
  const s1 = detectS1(prose)
  return { s1, s2: countS2(prose), clean: s1.length === 0 }
}
