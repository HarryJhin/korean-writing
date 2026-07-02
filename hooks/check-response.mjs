#!/usr/bin/env node
// Stop 훅: 마지막 assistant 응답이 한국어(한글 20자 이상)면 S1 결정론 검사.
// 위반 시 exit 2로 정지를 1회 차단해 재작성을 유도한다. 루프 가드: session+prompt
// 마커 파일 — 같은 턴의 두 번째 Stop은 무조건 통과. 그 외 전부 fail-open(exit 0).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { detectS1, stripCode } from '../lib/prose-checks.js'

const MIN_HANGUL = 20

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}
if (input?.stop_hook_active) process.exit(0) // 과거 문서의 필드 — 오면 존중

const key = `${input?.session_id || 'nosession'}-${input?.prompt_id || 'noprompt'}`.replace(/[^\w.-]/g, '_')
const markerDir = join(tmpdir(), 'korean-writing-stop-guard')
const marker = join(markerDir, key)
if (existsSync(marker)) process.exit(0)

// transcript(JSONL)에서 마지막 assistant 텍스트 추출. 형식은 비공식 — 실패 시 통과.
let lastText = ''
try {
  const lines = readFileSync(input.transcript_path, 'utf8').trim().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry
    try {
      entry = JSON.parse(lines[i])
    } catch {
      continue
    }
    if (entry?.type === 'assistant' && Array.isArray(entry?.message?.content)) {
      lastText = entry.message.content
        .filter(c => c?.type === 'text' && typeof c.text === 'string')
        .map(c => c.text)
        .join('\n')
      if (lastText) break
    }
  }
} catch {
  process.exit(0)
}

const hangulCount = (lastText.match(/[가-힣]/g) || []).length
if (hangulCount < MIN_HANGUL) process.exit(0)

const violations = detectS1(stripCode(lastText))
if (violations.length === 0) process.exit(0)

try {
  mkdirSync(markerDir, { recursive: true })
  writeFileSync(marker, String(Date.now()))
} catch {
  process.exit(0) // 마커를 못 쓰면 루프 가드 불가 — block하지 않는다
}

const lines = violations.map(v => `- ${v.name}: ${v.count}건 (예: "${v.matches[0].text}")`)
process.stderr.write(
  `[korean-writing] 응답에 S1 위반이 있다:\n${lines.join('\n')}\n` +
  `writing-korean 스킬의 R1 규칙에 따라 위 패턴을 제거하고 응답을 다시 작성하라.\n`,
)
process.exit(2)
