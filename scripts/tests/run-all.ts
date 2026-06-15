/**
 * Run all unit tests. Usage: npm test
 */
import { spawnSync } from 'child_process'
import { readdirSync } from 'fs'
import { join } from 'path'

const dir = join(__dirname)
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.test.ts'))
  .sort()

if (files.length === 0) {
  console.error('No test files found')
  process.exit(1)
}

let failed = 0
for (const file of files) {
  console.log(`\n--- ${file} ---`)
  const res = spawnSync('npx', ['tsx', join(dir, file)], { stdio: 'inherit', shell: true })
  if (res.status !== 0) failed++
}

console.log(`\n${failed === 0 ? '✅' : '❌'} ${files.length - failed}/${files.length} test files passed`)
process.exit(failed > 0 ? 1 : 0)