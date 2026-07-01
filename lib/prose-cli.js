import { readFileSync } from 'node:fs'
import { proseScore, longSentences } from './prose-checks.js'

function readInput() {
  const args = process.argv.slice(2)
  try {
    if (args.includes('--stdin')) return readFileSync(0, 'utf8') // fd 0 = stdin
    const file = args.find(a => !a.startsWith('--'))
    if (!file) {
      process.stderr.write('usage: prose-cli.js <file.md> | --stdin\n')
      process.exit(2)
    }
    return readFileSync(file, 'utf8')
  } catch (e) {
    process.stderr.write(`error: ${e.message}\n`)
    process.exit(2)
  }
}

const text = readInput()
const score = proseScore(text) // proseScore가 내부에서 stripCode 적용
const result = {
  clean: score.clean,
  s1: score.s1,
  s2: score.s2,
  longSentences: longSentences(text),
}
process.stdout.write(JSON.stringify(result, null, 2) + '\n')
process.exit(score.clean ? 0 : 1)
