export const meta = {
  name: 'korean-docs',
  description: '주제·소스로부터 한글 기술 레퍼런스 문서(.md)를 생성 — 리서치·사실검증·문체교정·자연스러움 검증 파이프라인 (자기완결: 외부 에이전트·스킬 불요)',
  phases: [
    { title: '스코프' },
    { title: '리서치' },
    { title: '사실 검증' },
    { title: '초안' },
    { title: '문체 교정' },
    { title: '자연스러움 검증' },
    { title: '조립' },
  ],
}

// args 허용 형태: 객체 { topic, docType?, source?, audience?, tone? } / topic 문자열 / 그 둘의 JSON 문자열.
let input = args
if (typeof input === 'string') {
  const s = input.trim()
  if (s.startsWith('{')) { try { input = JSON.parse(s) } catch { input = { topic: s } } }
  else { input = { topic: s } }
}
const req = input || {}
const existingDoc = (req.existingDoc || '').trim()
const sourcePath = (req.sourcePath || '').trim()
const mode = existingDoc ? 'edit' : 'generate'
const docType = req.docType || 'reference'

// ── 전역 배리어 상수 ──
const MAX_VERIFY_TOTAL = 30
const VOTES_PER_FACT = 3
const VERIFY_QUORUM = 2
// deep-research wf의 normURL 복제: www·trailing slash 제거 후 소문자. 출처 dedup 키.
const normURL = (u) => {
  try {
    const p = new URL(u)
    return (p.hostname.replace(/^www\./, '') + p.pathname.replace(/\/$/, '')).toLowerCase()
  } catch { return (u || '').toLowerCase() }
}

// ── 인라인 인제스트 (lib/ingest.js와 동일 로직 복제 — 자기완결, 동기화 대상) ──
const SOURCE_HEADING_INLINE = /^##\s+(출처|references)\s*$/i
const extractTitleInline = (md) => {
  const m = (md || '').match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}
const splitSectionsInline = (md) => {
  const lines = (md || '').split(/\r?\n/)
  const out = []
  let cur = null, inSrc = false
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+?)\s*$/)
    if (h2) {
      if (cur) out.push(cur)
      if (SOURCE_HEADING_INLINE.test(line)) { inSrc = true; cur = null; continue }
      inSrc = false; cur = { title: h2[1].trim(), body: [] }; continue
    }
    if (cur && !inSrc) cur.body.push(line)
  }
  if (cur) out.push(cur)
  return out.map(s => ({ title: s.title, markdown: s.body.join('\n').trim() }))
}
const parseSourcesInline = (md) => {
  const m = new Map()
  let inSrc = false
  for (const line of (md || '').split(/\r?\n/)) {
    if (/^##\s+/.test(line)) { inSrc = SOURCE_HEADING_INLINE.test(line); continue }
    if (!inSrc) continue
    const mm = line.match(/^\[(\d+)\]\s+(\S.*?)\s*$/)
    if (mm) m.set(Number(mm[1]), mm[2].trim())
  }
  return m
}

let topic = (req.topic || '').trim()
if (!topic && mode === 'edit') topic = extractTitleInline(existingDoc) || ''
if (!topic) throw new Error('args.topic 또는 args.existingDoc 필요 (생성·편집 대상)')

const existingSections = mode === 'edit' ? splitSectionsInline(existingDoc) : []
const existingSourceMap = mode === 'edit' ? parseSourcesInline(existingDoc) : new Map()
log(`모드: ${mode}${mode === 'edit' ? ` · 기존 섹션 ${existingSections.length}개` : ''}`)

// ── 인라인 스키마 (런타임 자기완결) ──
const OUTLINE_SCHEMA = {
  type: 'object', required: ['docType', 'audience', 'tone', 'sections'],
  properties: {
    docType: { type: 'string', enum: ['reference', 'how-to', 'tutorial', 'explanation'] },
    audience: { type: 'string' },
    tone: { type: 'string' },
    sections: { type: 'array', items: { type: 'object', required: ['title', 'researchQuestions'],
      properties: { title: { type: 'string' }, researchQuestions: { type: 'array', items: { type: 'string' } },
        fromExisting: { type: 'string' } } } },
  },
}
const FACT_SCHEMA = { type: 'object', required: ['facts'], properties: { facts: { type: 'array',
  items: { type: 'object', required: ['claim', 'source', 'importance', 'sourceQuality'], properties: {
    claim: { type: 'string' }, source: { type: 'string' },
    importance: { type: 'string', enum: ['central', 'supporting', 'tangential'] },
    sourceQuality: { enum: ['primary', 'secondary', 'blog', 'forum', 'unreliable'] } } } } } }
const FACT_VERDICT_SCHEMA = { type: 'object', required: ['verified', 'reason'],
  properties: { verified: { type: 'boolean' }, reason: { type: 'string' } } }
const EXTRACT_SCHEMA = { type: 'object', required: ['claims'], properties: { claims: { type: 'array',
  items: { type: 'object', required: ['claim'], properties: { claim: { type: 'string' }, citation: { type: 'number' } } } } } }
const SECTION_SCHEMA = { type: 'object', required: ['title', 'markdown'],
  properties: { title: { type: 'string' }, markdown: { type: 'string' } } }
const NATURALNESS_VERDICT_SCHEMA = { type: 'object', required: ['pass', 'fidelityOk', 'issues'],
  properties: { pass: { type: 'boolean' }, fidelityOk: { type: 'boolean' }, issues: { type: 'array', items: { type: 'string' } } } }

// ── 인라인 문체 기준 (한국 번역학 계보 + im-not-ai(MIT) + KatFishNet(ACL 2025) 근거) ──
const PROSE_RULES =
  '- S1(무조건 제거): em dash(—), 이모지, 산문 속 세미콜론, 이중 피동(되어진다·보여지다·잊혀지다 등 -여/혀/려/겨지다 계열).\n' +
  '- 번역투: "~에 의해 / ~를 통해 / ~에 대해", 과한 명사화("~에 대한 처리를 수행")를 동사형으로 푼다. 일본어식 쉼표 과다(주제격 "는/은/도" 뒤 쉼표)와 관형격 "-의" 연쇄 남용을 줄인다.\n' +
  '- 만연체 회피: 한 문장에 절을 겹겹이 내포하지 말고 끊는다. 무조건 짧게가 아니라 핵어-의존어 거리와 내포 깊이를 줄여 독자의 처리 부하를 낮춘다.\n' +
  '- 존댓말 어미는 한 문서에서 한 등급으로 일관되게 유지한다.\n' +
  '- 가능성 표현("~할 수 있다") 남발을 단정형으로 바꾼다.\n' +
  '- 영어 관습 전이 회피: 불필요한 주어(우리는/이것은), rule of three 강박, "단순히 X가 아니라 Y" 대구.\n' +
  '- 사실·수치·고유명사·코드 블록·인용 표기[n]은 100% 보존한다. 날조 금지 — 근거 없으면 채우지 말고 삭제한다.'

// ── 인라인 구성·마크다운 규칙 (레퍼런스 유형) ──
const MARKDOWN_RULES =
  '- 제목 계층: 문서 H1과 섹션 제목 H2는 조립 단계가 붙인다. 본문은 항목 제목 H3(###)부터 시작하고, 섹션 H2·문서 H1·중복 섹션 제목을 넣지 마라.\n' +
  '- 코드·시그니처는 펜스 코드블록(```lang)으로, 인라인 식별자는 백틱(`name`)으로.\n' +
  '- 파라미터·옵션·반환값은 표로 정리: | 이름 | 타입 | 기본값 | 설명 |.\n' +
  '- 각 항목 구성: 시그니처 → 한 줄 요약 → (파라미터 표) → 반환 → 예시 → 에러.\n' +
  '- 장식용 이모지·과한 볼드·수평선(---) 금지. 분량은 항목당 핵심만, 도입·요약 문단 없이 본론부터.'

// ── 인라인 S1 결정론적 게이트 ──
// lib/prose-checks.js의 S1_PATTERNS와 동일한 패턴이다. 워크플로우는 ~/.claude/workflows/로
// 단일 파일 복사돼 lib/를 동반하지 못하므로(모듈 로딩 불가) 자기완결을 위해 인라인한다.
// LLM 판정(자연스러움 리뷰)과 독립적으로 작동하는 0/1 하드 게이트다.
const stripCodeForProse = (md) => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
const S1_INLINE = [
  { name: 'em dash(—)', re: /—/g },
  { name: '이모지', re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu },
  { name: '세미콜론(산문)', re: /;/g },
  // lib/prose-checks.js의 double-passive와 동일 패턴(동기화 대상). 빈출 축약형 보여지다·잊혀지다
  // (-여/혀/려/겨 + 지/진/졌/질/져)까지 잡고, 어간 한글 1자 선행 요구로 명사 '여지' 오검출을 막는다.
  { name: '이중 피동(되어진다/보여지다 등)', re: /(되어[지진]|지게\s*된|[가-힣](여|혀|려|겨)(지|진|졌|질|져))/g },
]
const s1Violations = (md) => {
  const prose = stripCodeForProse(md)
  return S1_INLINE.filter(p => (prose.match(p.re) || []).length > 0).map(p => p.name)
}

// ── 1. 스코프 ──
phase('스코프')
const outline = await agent(
  `너는 기술 문서 설계자다. 목표: 독자가 빠르게 정확한 답을 찾는 레퍼런스 구조를 설계한다.\n` +
  `주제: ${topic}\n문서 유형: ${docType} (Diátaxis 레퍼런스 — API/설정/CLI의 정확한 스펙)\n` +
  (req.source ? `참고 소스:\n${req.source}\n` : '') +
  (req.audience ? `지정 독자: ${req.audience}\n` : '') +
  (req.tone ? `지정 톤앤매너: ${req.tone}\n` : '') +
  (mode === 'edit'
    ? `\n[편집 모드] 아래는 개정 대상 기존 문서의 섹션들이다. 이상적 레퍼런스 구조를 새로 설계하되, ` +
      `각 신규 섹션이 기존 섹션에서 유래하면 그 기존 제목을 fromExisting에 적는다(없으면 생략). ` +
      `기존에 없던 새 섹션은 fromExisting 없이 둔다.\n기존 섹션:\n` +
      existingSections.map(s => `- ${s.title}`).join('\n') + '\n'
    : '') +
  `다음을 정한다:\n` +
  `- audience: 이 문서를 읽는 구체적 독자(지정값이 있으면 그대로). 예: "REST API를 처음 쓰는 백엔드 개발자"\n` +
  `- tone: 톤앤매너(지정값이 있으면 그대로). 예: "간결하고 중립적인 레퍼런스체, 군더더기 없이"\n` +
  `- sections: 필수 섹션(개요, 항목별 레퍼런스, 에러/예외)과 각 섹션의 리서치 질문 1~4개`,
  { schema: OUTLINE_SCHEMA, label: 'scope:outline' }
)
if (!outline || !Array.isArray(outline.sections) || outline.sections.length === 0) return { error: '아웃라인 에이전트가 결과를 반환하지 않았다(스코프 단계 실패).', topic, mode }
const sections = outline.sections || []
if (mode === 'edit') {
  const kept = new Set(sections.map(s => s.fromExisting).filter(Boolean))
  const droppedExisting = existingSections.map(s => s.title).filter(t => !kept.has(t))
  if (droppedExisting.length) log(`구조 재설계: 기존 섹션 ${droppedExisting.length}개 드롭 — ${droppedExisting.join(', ')}`)
}
const audience = (req.audience || outline.audience || '기술 실무자').trim()
const tone = (req.tone || outline.tone || '간결하고 정확한 레퍼런스체').trim()
log(`아웃라인 ${sections.length}개 섹션 · 독자: ${audience}`)

// ── 2. 섹션별 리서치 (pipeline, 무배리어) — 검증은 전역 배리어로 분리 ──
const researched = await pipeline(
  sections,
  async (section) => {
    const r = await agent(
      `너는 기술 사실 조사자다. 목표: 검증 가능한 출처로 뒷받침되는 사실만 모은다.\n` +
      `다음 리서치 질문들에 대해 웹·공식 문서를 조사해 사실을 수집한다. 각 사실에 출처 URL을 단다. 확인 안 되면 포함하지 말 것(날조 금지).\n` +
      `각 사실에 importance(central/supporting/tangential)와 sourceQuality(primary/secondary/blog/forum/unreliable)를 매긴다. ` +
      `공식 문서·1차 자료=primary, 보도=secondary, 개인 블로그=blog, 포럼=forum, 신뢰 불가=unreliable.\n` +
      `섹션: ${section.title}\n질문:\n${(section.researchQuestions || []).map(q => '- ' + q).join('\n')}`,
      { schema: FACT_SCHEMA, label: `research:${section.title}`, phase: '리서치' }
    )
    let facts = (r && r.facts) || []
    if (mode === 'edit' && section.fromExisting) {
      const orig = existingSections.find(s => s.title === section.fromExisting)
      if (orig && orig.markdown) {
        const extracted = await agent(
          `너는 기술 문서에서 검증 가능한 사실 주장만 뽑아내는 추출기다. 아래 기존 섹션 본문에서 ` +
          `사실 주장을 추출한다. 각 주장에 본문의 인용 번호 [n]이 달려 있으면 그 숫자를 citation에 적는다(없으면 생략). ` +
          `의견·서술·예시 설명이 아니라 검증 가능한 기술적 사실만.\n\n${orig.markdown}`,
          { schema: EXTRACT_SCHEMA, label: `extract:${section.title}`, phase: '리서치' }
        )
        let unsourcedDropped = 0
        for (const c of ((extracted && extracted.claims) || [])) {
          const srcUrl = c.citation != null ? (existingSourceMap.get(c.citation) || '') : ''
          if (!srcUrl) { unsourcedDropped++; continue }
          facts.push({ claim: c.claim, source: srcUrl, importance: 'supporting', sourceQuality: 'secondary', _origin: 'existing' })
        }
        if (unsourcedDropped) log(`${section.title}: 출처 없는 원본 주장 ${unsourcedDropped}건 기각(검증 전)`)
      }
    }
    return { section, facts }
  }
)

// ═══ 배리어: 전 섹션 fact를 전역 풀로 평탄화 (sectionTitle 태그) ═══
phase('사실 검증')
const globalFacts = researched.filter(Boolean).flatMap(
  r => (r.facts || []).map(f => ({ ...f, sectionTitle: r.section.title }))
)
const sectionByTitle = new Map(researched.filter(Boolean).map(r => [r.section.title, r.section]))
log(`전역 풀: ${globalFacts.length}건 (${sectionByTitle.size}개 섹션)`)

// dedup: 같은 (정규화 출처 + 정규화 주장)은 1건으로. (E·F)
const factKey = (f) => normURL(f.source) + '||' + (f.claim || '').trim().replace(/\s+/g, ' ')
const seenFact = new Set()
const dedupedFacts = []
let dedupDropped = 0
for (const f of globalFacts) {
  const k = factKey(f)
  if (seenFact.has(k)) { dedupDropped++; continue }
  seenFact.add(k); dedupedFacts.push(f)
}
if (dedupDropped) log(`중복 사실 ${dedupDropped}건 병합`)

// 랭킹 → 전역 캡. (A) 검증 호출 수를 fact 총량과 무관하게 상한으로 묶는다.
const impRank = { central: 0, supporting: 1, tangential: 2 }
const qualRank = { primary: 0, secondary: 1, blog: 2, forum: 3, unreliable: 4 }
const rankedFacts = [...dedupedFacts]
  .sort((a, b) => (impRank[a.importance] - impRank[b.importance]) || (qualRank[a.sourceQuality] - qualRank[b.sourceQuality]))
  .slice(0, MAX_VERIFY_TOTAL)
const capDropped = dedupedFacts.length - rankedFacts.length
if (capDropped > 0) log(`전역 캡: ${dedupedFacts.length}건 중 상위 ${rankedFacts.length}건만 검증(${capDropped}건 컷)`)

// N표 grounded 적대 검증. parallel은 실패 thunk(agent 오류 포함)를 null로 resolve하며 절대
// reject하지 않는다(런타임 계약) → 아래 filter(Boolean)가 실패 표를 abstain으로 제외한다. (B·D)
const verifyOne = (fact) => parallel(
  Array.from({ length: VOTES_PER_FACT }, (_, i) => () =>
    agent(
      `너는 기술 문서 사실 검증자다. 목표: 출처가 주장을 실제로 뒷받침하는지 적대적으로 가린다.\n` +
      `1) WebFetch로 아래 출처 URL을 직접 열어 본문에서 주장을 확인한다. ` +
      `2) 의심되면 WebSearch로 모순·반증 증거를 찾는다. ` +
      `3) 시그니처·파라미터·기본값·버전 같은 기술적 사실은 특히 엄격히 본다.\n` +
      `출처에서 직접 확인되지 않으면 verified=false. 불확실하면 기각이 기본값이다.\n` +
      `주장: ${fact.claim}\n출처: ${fact.source} (${fact.sourceQuality})`,
      { schema: FACT_VERDICT_SCHEMA, label: `verify:${fact.sectionTitle}#${i}`, phase: '사실 검증' }
    )
  )
).then(votes => {
  const valid = votes.filter(Boolean)
  const verifiedCount = valid.filter(v => v.verified).length
  // 정족수: 유효표가 정족수 이상이고 verified가 정족수 이상이어야 통과. 과다 abstain → 통과 불가.
  return (valid.length >= VERIFY_QUORUM && verifiedCount >= VERIFY_QUORUM) ? fact : null
})

const verdicts = await parallel(rankedFacts.map(f => () => verifyOne(f)))
const verifiedFacts = verdicts.filter(Boolean)
const verifyCalls = rankedFacts.length * VOTES_PER_FACT
log(`검증: ${rankedFacts.length}건 중 ${verifiedFacts.length}건 확정`)

// ── 검증 통과분을 섹션으로 재귀속 (전역 → 섹션 왕복) ──
// 게이트3: 확정 사실이 0건인 섹션은 초안에 넘기지 않는다. 검증을 통과한 사실이 없으면
// 작가는 '출처 필요'만 가득한 빈 껍데기를 쓰게 되므로, 그 전에 드롭한다. 원래 섹션 순서 보존.
const factsBySection = new Map()
for (const f of verifiedFacts) {
  if (!factsBySection.has(f.sectionTitle)) factsBySection.set(f.sectionTitle, [])
  factsBySection.get(f.sectionTitle).push(f)
}
const valid = sections
  .map(s => ({ section: sectionByTitle.get(s.title) || s, facts: factsBySection.get(s.title) || [] }))
  .filter(r => r.facts.length > 0)
const emptyDropped = sections.map(s => s.title).filter(t => !(factsBySection.get(t) || []).length)
if (emptyDropped.length) log(`사실 0건으로 드롭된 섹션 ${emptyDropped.length}개: ${emptyDropped.join(', ')}`)
// 출처 번호 부여 — normURL 기준 dedup(www·trailing slash 차이 통합). (E)
const sourceList = []
const sourceNum = new Map()
for (const r of valid) {
  for (const f of r.facts) {
    const key = normURL(f.source)
    if (key && !sourceNum.has(key)) { sourceList.push((f.source || '').trim()); sourceNum.set(key, sourceList.length) }
  }
}
const cite = (src) => sourceNum.get(normURL(src)) || '?'

// ── 4~6. 섹션별 초안 → 문체교정 → 자연스러움 검증 (pipeline) ──
const finished = await pipeline(
  valid,
  (r) => agent(
    `너는 기술 문서 작가다. 목표: 아래 독자에게 지정 톤으로, 확정 사실만으로 정확·명료한 섹션을 쓴다.\n` +
    `독자: ${audience}\n톤앤매너: ${tone}\n` +
    `구성·마크다운 규칙:\n${MARKDOWN_RULES}\n` +
    `인용: 사실을 본문에 쓸 때 해당 출처 번호를 [n] 형태로 문장 끝에 단다(예: "기본값은 0이다 [2]"). 출처 목록·참고문헌은 본문에 만들지 마라 — [n] 인라인 인용만 달고, 출처 목록은 조립 단계가 붙인다.\n` +
    `사실에 없는 내용 추가 금지. 부족하면 '출처 필요'로 표시.\n` +
    ((mode === 'edit' && r.section.fromExisting)
      ? `기존 본문(표현·구성을 사실이 보존되는 한 최대한 유지하되, 확정 사실에 없는 내용은 버린다. 이 기존 본문에 박힌 옛 인용번호 [n]은 무시하고, 위 '확정 사실'의 번호만 사용한다):\n${(existingSections.find(s => s.title === r.section.fromExisting) || {}).markdown || ''}\n`
      : '') +
    `섹션 제목: ${r.section.title}\n확정 사실(번호=출처):\n${r.facts.map(f => `- [${cite(f.source)}] ${f.claim} (출처: ${f.source})`).join('\n') || '(없음)'}`,
    { schema: SECTION_SCHEMA, label: `draft:${r.section.title}`, phase: '초안' }
  ).then(s => s ? ({ ...r, draft: s }) : null),
  (r) => !r ? null : agent(
    `너는 한국어 기술문서 에디터다. 목표: 아래 독자·톤을 유지하며 한국어 문체를 교정한다.\n` +
    `독자: ${audience}\n톤앤매너: ${tone}\n기준:\n${PROSE_RULES}\n교정된 본문 Markdown만 반환한다 — 변경 내역·설명·메모를 본문에 넣지 마라.\n\n${r.draft.markdown}`,
    { schema: SECTION_SCHEMA, label: `prose:${r.section.title}`, phase: '문체 교정' }
  ).then(s => s ? ({ ...r, edited: s }) : null),
  async (r) => {
    if (!r) return null
    // 게이트1: 검사→수정→재검사의 폐루프. 재작성본을 검증 없이 반환하지 않고,
    //          루프 상단으로 돌아가 다시 판정한다. MAX_REDO로 무한루프를 막는다.
    // 게이트2: S1(em dash·이모지·세미콜론·이중피동)은 결정론적 0/1 하드 게이트로,
    //          LLM 자연스러움 판정과 AND로 묶인다. 둘 다 통과해야 섹션이 확정된다.
    const MAX_REDO = 2
    let md = r.edited.markdown
    const factLines = r.facts.map(f => `- [${cite(f.source)}] ${f.claim}`).join('\n') || '(없음)'
    for (let round = 0; ; round++) {
      const review = await agent(
        `너는 한국어 자연스러움 리뷰어다. 세 가지를 판정한다. ` +
        `(1) 자연스러움: "이 글이 왜 아직도 AI처럼 읽히나?" 남은 신호(균일한 리듬, 의견 부재, 기계적 전환어, 번역투)를 issues로 적는다. ` +
        `(2) 독자·톤 적합: '${audience}'에게 '${tone}' 톤으로 적절한지 본다. ` +
        `(3) 사실 충실도: 교정 과정에서 원 사실이 왜곡·날조됐는지, 인용 [n]이 보존됐는지 확인해 fidelityOk를 정한다. ` +
        `(1)·(2)가 모두 만족이면 pass=true.\n` +
        `원 사실:\n${factLines}\n\n섹션:\n${md}`,
        { schema: NATURALNESS_VERDICT_SCHEMA, label: `review:${r.section.title}#${round}`, phase: '자연스러움 검증' }
      )
      const s1 = s1Violations(md)
      if (review.pass && review.fidelityOk && s1.length === 0) return { title: r.section.title, markdown: md }
      if (round >= MAX_REDO) {
        log(`${r.section.title}: 게이트 ${MAX_REDO + 1}회 미통과 (S1 잔여 ${s1.length}건) — 마지막 교정본 사용`)
        return { title: r.section.title, markdown: md }
      }
      const issues = [...(review.issues || [])]
      if (s1.length) issues.push(`S1 위반 무조건 제거: ${s1.join(', ')}`)
      const fixed = await agent(
        `아래 지적을 반영해 섹션을 다시 쓴다. 독자(${audience})·톤(${tone}) 유지, 문체 기준 유지, 사실·인용[n] 보존, 날조 금지. 교정된 본문만 반환(변경 내역·설명 금지).\n${PROSE_RULES}\n\n지적:\n${issues.map(x => '- ' + x).join('\n')}\n\n섹션:\n${md}`,
        { schema: SECTION_SCHEMA, label: `prose-redo:${r.section.title}#${round}`, phase: '문체 교정' }
      )
      md = fixed.markdown
    }
  }
)

// ── 7. 조립 ──
phase('조립')
const ordered = finished.filter(Boolean)
if (ordered.length === 0) {
  return {
    error: '확정 사실이 있는 섹션이 없어 문서를 만들지 못했다.',
    topic, mode,
    diagnostics: { sections: sections.length, globalFacts: globalFacts.length, verified: verifiedFacts.length, emptyDropped },
  }
}
if (mode === 'edit') {
  const reusedCount = sections.filter(s => s.fromExisting).length
  const newCount = sections.length - reusedCount
  log(`편집 완료: 재사용 요청 ${reusedCount} · 신규 ${newCount} · 최종 ${ordered.length}개 섹션(보존 여부는 섹션별 '원본 주장 N/M' 로그 참조)`)
}
const finalTitles = new Set(ordered.map(s => s.title))
const droppedSections = sections.map(s => s.title).filter(t => !finalTitles.has(t))
if (droppedSections.length) log(`드롭된 섹션 ${droppedSections.length}개: ${droppedSections.join(', ')}`)

const refList = sourceList.length
  ? `\n## 출처\n\n${sourceList.map((u, i) => `[${i + 1}] ${u}`).join('\n')}\n`
  : ''
// 방어층: 작가가 중복으로 넣은 선두 섹션/문서 제목(H1·H2)을 제거한다(조립이 정규 H2를 붙이므로).
const stripDupHeading = (md) => md.replace(/^\s*#{1,2}\s+.*(?:\r?\n|$)/, '').trim()
const body = ordered.map(s => `## ${s.title}\n\n${stripDupHeading(s.markdown)}\n`).join('\n')
const finalDoc = `# ${topic}\n\n${body}${refList}`

const s1remaining = s1Violations(finalDoc)
log(`완성: ${ordered.length}개 섹션, 출처 ${sourceList.length}건, 잔여 S1 ${s1remaining.length}건${s1remaining.length ? ` (${s1remaining.join(', ')})` : ''}`)

// 에이전트 호출 추정: outline 1 + research(섹션수) + 검증 + 초안/문체/자연스러움(섹션×3 근사).
const agentCalls = 1 + sections.length + verifyCalls + (ordered.length * 3)
return {
  markdown: finalDoc,
  sections: ordered.length,
  sources: sourceList,
  stats: {
    sectionsPlanned: sections.length,
    globalFacts: globalFacts.length,
    dedupDropped,
    capDropped: Math.max(0, capDropped),
    verified: verifiedFacts.length,
    sectionsDropped: emptyDropped.length,
    sourcesCited: sourceList.length,
    s1Remaining: s1remaining.length,
    agentCalls,
  },
}
