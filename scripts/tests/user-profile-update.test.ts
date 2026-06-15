/**
 * Profile update error classifier tests.
 * Run: npx tsx scripts/tests/user-profile-update.test.ts
 */
import { isMissingColumnError, isSlugColumnError } from '../../src/lib/user-profile-update'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(
  isMissingColumnError(new Error('The column `latitude` does not exist in the current database.')),
  'latitude column error'
)
assert(
  isSlugColumnError(new Error('Unknown argument `slug`')),
  'slug error'
)
assert(!isMissingColumnError(new Error('Unique constraint failed')), 'non-column error')

console.log('user-profile-update.test.ts OK')