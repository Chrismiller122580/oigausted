import type { Session } from 'next-auth'
import { getPostLoginRedirectPath } from '../../src/lib/session'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function session(partial: Session['user']): Session {
  return { user: partial, expires: '2099-01-01' }
}

assert(getPostLoginRedirectPath(null) === '/login', 'null session -> login')
assert(getPostLoginRedirectPath(session({ role: 'accountant', staffRole: 'accountant' })) === '/accountant', 'accountant staff')
assert(getPostLoginRedirectPath(session({ role: 'buyer', staffRole: 'analytics' })) === '/analytics', 'analytics staff')
assert(getPostLoginRedirectPath(session({ role: 'buyer', staffRole: 'admin_assistant' })) === '/admin-assistant', 'admin assistant staff')
assert(getPostLoginRedirectPath(session({ role: 'seller' })) === '/seller', 'seller')
assert(getPostLoginRedirectPath(session({ role: 'buyer' })) === '/buyer', 'buyer')
assert(getPostLoginRedirectPath(session({ role: 'admin' })) === '/admin', 'admin')

console.log('post-login-redirect.test.ts OK')