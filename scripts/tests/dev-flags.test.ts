import { allowDevPaymentSimulate } from '../../src/lib/dev-flags'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const env = { ...process.env }

process.env.ALLOW_DEV_PAYMENT_SIMULATE = 'true'
process.env.NODE_ENV = 'production'
process.env.VERCEL = '1'
assert(allowDevPaymentSimulate(), 'explicit flag overrides production')

process.env.ALLOW_DEV_PAYMENT_SIMULATE = ''
process.env.NODE_ENV = 'production'
assert(!allowDevPaymentSimulate(), 'production blocked without flag')

process.env.NODE_ENV = 'development'
delete process.env.VERCEL
assert(allowDevPaymentSimulate(), 'local dev allowed')

Object.assign(process.env, env)
console.log('dev-flags.test.ts OK')