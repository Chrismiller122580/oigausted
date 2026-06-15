import { isSecretUnchanged, maskSecretConfigured, SECRET_UNCHANGED } from '../../src/lib/secrets'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(isSecretUnchanged(''), 'empty unchanged')
assert(isSecretUnchanged(SECRET_UNCHANGED), 'sentinel unchanged')
assert(!isSecretUnchanged('real-password'), 'real value changed')
assert(maskSecretConfigured(true) === SECRET_UNCHANGED, 'mask when configured')
assert(maskSecretConfigured(false) === '', 'empty when not configured')

console.log('secrets.test.ts OK')