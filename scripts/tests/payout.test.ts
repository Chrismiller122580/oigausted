import { calculateOrderPayout, aggregatePayouts, DEFAULT_PAYOUT_CONFIG } from '../../src/lib/payout'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const b1 = calculateOrderPayout(100000, true, DEFAULT_PAYOUT_CONFIG)
assert(b1.grossAmount === 100000 && b1.referralFee > 0 && b1.netToSeller > 0, 'referral breakdown')

const b2 = calculateOrderPayout(50000, false, DEFAULT_PAYOUT_CONFIG)
assert(b2.referralFee === 0, 'no referral fee')

const agg = aggregatePayouts([b1, b2])
assert(agg.netToSeller === b1.netToSeller + b2.netToSeller, 'aggregate net')

console.log('payout.test.ts OK')