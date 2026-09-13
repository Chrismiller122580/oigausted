/**
 * Business-name email validation tests.
 * Run: npx tsx scripts/tests/business-name.test.ts
 */
import { isEmailAsBusinessName, isEmailAddress, EMAIL_AS_BUSINESS_NAME_ERROR } from '../../src/lib/business-name'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(isEmailAddress('john@example.com'), 'plain email')
assert(isEmailAddress('john.doe+tag@sub.example.co'), 'tagged email')
assert(!isEmailAddress('Mi Negocio SAS'), 'business name')
assert(!isEmailAddress(''), 'empty')

assert(
  isEmailAsBusinessName('john@example.com') === EMAIL_AS_BUSINESS_NAME_ERROR,
  'email as business name rejected'
)
assert(
  isEmailAsBusinessName('Mi Negocio SAS') === null,
  'real business name allowed'
)
assert(
  isEmailAsBusinessName('john@example.com', 'john@example.com') === EMAIL_AS_BUSINESS_NAME_ERROR,
  'exact email match rejected'
)
assert(
  isEmailAsBusinessName('  john@example.com  ') === EMAIL_AS_BUSINESS_NAME_ERROR,
  'trimmed email rejected'
)
assert(isEmailAsBusinessName(null) === null, 'null allowed')
assert(isEmailAsBusinessName('') === null, 'empty allowed')

console.log('business-name.test.ts OK')
