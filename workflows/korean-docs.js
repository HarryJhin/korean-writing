export const meta = {
  name: 'korean-docs',
  description: '주제·소스로부터 한글 기술 레퍼런스 문서(.md)를 생성 — 리서치·사실검증·문체교정·자연스러움 검증 파이프라인',
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

const req = typeof args === 'string' ? { topic: args } : (args || {})
const topic = (req.topic || '').trim()
const docType = req.docType || 'reference'
if (!topic) throw new Error('args.topic 필요 (생성할 문서 주제)')

// ── 인라인 스키마 (런타임 자기완결) ──
const OUTLINE_SCHEMA = {
  type: 'object', required: ['docType', 'audience', 'sections'],
  properties: {
    docType: { type: 'string', enum: ['reference', 'how-to', 'tutorial', 'explanation'] },
    audience: { type: 'string' },
    sections: { type: 'array', items: { type: 'object', required: ['title', 'researchQuestions'],
      properties: { title: { type: 'string' }, researchQuestions: { type: 'array', items: { type: 'string' } } } } },
  },
}
const FACT_SCHEMA = { type: 'object', required: ['facts'], properties: { facts: { type: 'array',
  items: { type: 'object', required: ['claim', 'source'], properties: { claim: { type: 'string' }, source: { type: 'string' } } } } } }
const FACT_VERDICT_SCHEMA = { type: 'object', required: ['verified', 'reason'],
  properties: { verified: { type: 'boolean' }, reason: { type: 'string' } } }
const SECTION_SCHEMA = { type: 'object', required: ['title', 'markdown'],
  properties: { title: { type: 'string' }, markdown: { type: 'string' } } }
const NATURALNESS_VERDICT_SCHEMA = { type: 'object', required: ['pass', 'fidelityOk', 'issues'],
  properties: { pass: { type: 'boolean' }, fidelityOk: { type: 'boolean' }, issues: { type: 'array', items: { type: 'string' } } } }

// ── 1. 스코프 ──
phase('스코프')
const outline = await agent(
  `한글 기술 문서를 작성하기 위한 아웃라인을 설계한다.\n` +
  `주제: ${topic}\n문서 유형: ${docType} (Diátaxis 레퍼런스 — API/설정/CLI의 정확한 스펙 기술)\n` +
  (req.source ? `참고 소스:\n${req.source}\n` : '') +
  `레퍼런스 문서의 필수 섹션(개요, 항목별 레퍼런스, 에러/예외)을 포함하고, ` +
  `각 섹션마다 사실 확인이 필요한 리서치 질문을 1~4개 만든다. 한국어로.`,
  { schema: OUTLINE_SCHEMA, label: 'scope:outline' }
)
const sections = outline.sections || []
log(`아웃라인 ${sections.length}개 섹션`)

// ── 2~3. 섹션별 리서치 → 사실 적대 검증 (pipeline, 배리어 없음) ──
const researched = await pipeline(
  sections,
  (section) => agent(
    `다음 리서치 질문들에 대해 웹·공식 문서를 조사해 사실을 수집한다. ` +
    `각 사실에 출처 URL을 단다. 확인 안 되면 포함하지 말 것(날조 금지).\n` +
    `섹션: ${section.title}\n질문:\n${(section.researchQuestions || []).map(q => '- ' + q).join('\n')}`,
    { schema: FACT_SCHEMA, label: `research:${section.title}`, phase: '리서치' }
  ).then(r => ({ section, facts: r.facts || [] })),
  async (r) => {
    const verified = []
    for (const fact of r.facts) {
      // Workflow 런타임 계약: parallel은 실패한 thunk(agent 오류 포함)를 null로 resolve하며
      // 절대 reject하지 않는다. 따라서 verifier 하나가 실패해도 파이프라인이 중단되지 않고,
      // 아래 votes.filter(Boolean)가 실패 표를 제외한다(부분 결과 + 정족수 판정 유지).
      const votes = await parallel([0, 1, 2].map(i => () =>
        agent(
          `다음 주장이 출처에 의해 뒷받침되는지 적대적으로 검증한다. 불확실하면 verified=false.\n` +
          `주장: ${fact.claim}\n출처: ${fact.source}`,
          { schema: FACT_VERDICT_SCHEMA, label: `verify:${r.section.title}#${i}`, phase: '사실 검증', agentType: 'fact-verifier' }
        )
      ))
      if (votes.filter(Boolean).filter(v => v.verified).length >= 2) verified.push(fact)
    }
    log(`${r.section.title}: 사실 ${verified.length}/${r.facts.length} 확정`)
    return { section: r.section, facts: verified }
  }
)

// ── 4~6. 섹션별 초안 → 문체교정 → 자연스러움 검증 (pipeline) ──
const finished = await pipeline(
  researched.filter(Boolean),
  (r) => agent(
    `확정된 사실만으로 한글 기술 문서의 '${r.section.title}' 섹션을 작성한다(Markdown). ` +
    `레퍼런스 톤: 정확하고 간결. 사실에 없는 내용 추가 금지. 사실이 부족한 부분은 '출처 필요'로 표시.\n` +
    `확정 사실:\n${r.facts.map(f => `- ${f.claim} (출처: ${f.source})`).join('\n') || '(없음)'}`,
    { schema: SECTION_SCHEMA, label: `draft:${r.section.title}`, phase: '초안' }
  ).then(s => ({ ...r, draft: s })),
  (r) => agent(
    `다음 한글 섹션을 교정한다. 사실·수치·고유명사·코드는 100% 보존(날조 금지).\n\n${r.draft.markdown}`,
    { schema: SECTION_SCHEMA, label: `prose:${r.section.title}`, phase: '문체 교정', agentType: 'prose-editor' }
  ).then(s => ({ ...r, edited: s })),
  async (r) => {
    const review = await agent(
      `다음 한글 기술문서 섹션을 검토한다. 자연스러움(pass)과 사실 충실도(fidelityOk)를 판정한다.\n` +
      `원 사실:\n${r.facts.map(f => '- ' + f.claim).join('\n') || '(없음)'}\n\n섹션:\n${r.edited.markdown}`,
      { schema: NATURALNESS_VERDICT_SCHEMA, label: `review:${r.section.title}`, phase: '자연스러움 검증', agentType: 'naturalness-reviewer' }
    )
    if (review.pass && review.fidelityOk) return { title: r.section.title, markdown: r.edited.markdown }
    const fixed = await agent(
      `아래 지적을 반영해 섹션을 다시 쓴다. 사실 보존, 날조 금지.\n` +
      `지적:\n${(review.issues || []).map(x => '- ' + x).join('\n')}\n\n섹션:\n${r.edited.markdown}`,
      { schema: SECTION_SCHEMA, label: `prose-redo:${r.section.title}`, phase: '문체 교정', agentType: 'prose-editor' }
    )
    return { title: r.section.title, markdown: fixed.markdown }
  }
)

// ── 7. 조립 ──
phase('조립')
const ordered = finished.filter(Boolean)
const finalTitles = new Set(ordered.map(s => s.title))
const droppedSections = sections.map(s => s.title).filter(t => !finalTitles.has(t))
if (droppedSections.length) log(`드롭된 섹션 ${droppedSections.length}개: ${droppedSections.join(', ')}`)
const seen = new Set()
const sources = []
for (const r of researched.filter(Boolean)) {
  for (const f of r.facts) {
    const u = (f.source || '').trim()
    if (u && !seen.has(u)) { seen.add(u); sources.push(u) }
  }
}
const refList = sources.length
  ? `\n## 출처\n\n${sources.map((u, i) => `${i + 1}. ${u}`).join('\n')}\n`
  : ''
const body = ordered.map(s => `## ${s.title}\n\n${s.markdown.trim()}\n`).join('\n')
const finalDoc = `# ${topic}\n\n${body}${refList}`

const prose = finalDoc.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
const s1hits = (prose.match(/[—;]/g) || []).length + (prose.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu) || []).length
log(`완성: ${ordered.length}개 섹션, 출처 ${sources.length}건, 잔여 S1 후보 ${s1hits}건`)

return { markdown: finalDoc, sections: ordered.length, sources }
