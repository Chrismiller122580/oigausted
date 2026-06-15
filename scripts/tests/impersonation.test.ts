import { createImpersonationToken, verifyImpersonationToken } from '../../src/lib/impersonation'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const prev = process.env.NEXTAUTH_SECRET
process.env.NEXTAUTH_SECRET = 'test-secret-for-impersonation-unit-tests-32chars'

const token = createImpersonationToken('admin-1', 'user-2')
assert(!!token, 'token created')

const verified = verifyImpersonationToken(token!)
assert(verified?.adminId === 'admin-1' && verified?.targetUserId === 'user-2', 'token verified')

assert(verifyImpersonationToken('invalid') === null, 'invalid rejected')
assert(verifyImpersonationToken('') === null, 'empty rejected')

process.env.NEXTAUTH_SECRET = prev
console.log('impersonation.test.ts OK')