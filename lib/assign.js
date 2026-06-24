// claim을 선언 섹션에 배정(LLM assignment 맵 기반)한 뒤 섹션별 랭킹+캡.
// 워크플로우(workflows/korean-docs.js)에 동일 로직이 인라인 미러된다 — 한쪽 수정 시 양쪽 동기화.
export const IMP_RANK = { central: 0, supporting: 1, tangential: 2 }
export const QUAL_RANK = { primary: 0, secondary: 1, blog: 2, forum: 3, unreliable: 4 }

export function groupAndCap(claims, assignments, sectionTitles, maxPerSection) {
  const titleSet = new Set(sectionTitles)
  const bySection = new Map(sectionTitles.map(t => [t, []]))
  const placed = new Set()
  for (const a of (assignments || [])) {
    const c = claims[a.claimId]
    if (!c || placed.has(a.claimId)) continue
    if (a.sectionTitle == null || !titleSet.has(a.sectionTitle)) continue
    bySection.get(a.sectionTitle).push(c)
    placed.add(a.claimId)
  }
  let capDropped = 0
  for (const [t, list] of bySection) {
    list.sort((x, y) => (IMP_RANK[x.importance] - IMP_RANK[y.importance]) || (QUAL_RANK[x.sourceQuality] - QUAL_RANK[y.sourceQuality]))
    if (list.length > maxPerSection) { capDropped += list.length - maxPerSection; bySection.set(t, list.slice(0, maxPerSection)) }
  }
  return { bySection, droppedUnassigned: claims.length - placed.size, capDropped }
}
