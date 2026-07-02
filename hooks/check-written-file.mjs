#!/usr/bin/env node
// PostToolUse(Write|Edit) 훅: 한글 포함 텍스트 문서(.md/.markdown/.txt)의 S1 결정론 검사.
// 위반 시 exit 2 + stderr 피드백(에이전트가 즉시 수정). 그 외 전부 fail-open(exit 0).
import { readFileSync } from 'node:fs'
import { detectS1, stripCode } from '../lib/prose-checks.js'

const IGNORE_MARKER = 'korean-writing:ignore'
const TEXT_EXT = /\.(md|markdown|txt)$/i

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  process.exit(0)
}

const filePath = input?.tool_input?.file_path
if (typeof filePath !== 'string' || !TEXT_EXT.test(filePath)) process.exit(0)

let text
try {
  text = readFileSync(filePath, 'utf8')
} catch {
  process.exit(0)
}

if (text.includes(IGNORE_MARKER)) process.exit(0)
if (!/[가-힣]/.test(text)) process.exit(0)

const violations = detectS1(stripCode(text))
if (violations.length === 0) process.exit(0)

const lines = violations.map(v => `- ${v.name}: ${v.count}건 (예: "${v.matches[0].text}")`)
process.stderr.write(
  `[korean-writing] ${filePath} S1 위반:\n${lines.join('\n')}\n` +
  `writing-korean 스킬의 R1 규칙에 따라 위 패턴을 제거하라. ` +
  `의도된 예외 문서면 파일에 "${IGNORE_MARKER}" 마커를 넣는다.\n`,
)
process.exit(2)
