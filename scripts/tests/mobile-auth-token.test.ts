import assert from 'node:assert/strict'
import { createMobileAuthToken, verifyMobileAuthToken } from '../../src/lib/mobile-auth-token'

process.env.NEXTAUTH_SECRET = 'test-secret-for-mobile-handoff-unit-tests-32chars'

const token = createMobileAuthToken('user-abc')
assert(token, 'token created')

const verified = verifyMobileAuthToken(token!)
assert(verified?.userId === 'user-abc', 'userId matches')

assert(verifyMobileAuthToken('invalid') === null, 'invalid rejected')
assert(verifyMobileAuthToken('') === null, 'empty rejected')

console.log('mobile-auth-token.test.ts OK')