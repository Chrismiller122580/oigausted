/**
 * Basic test for payout lib (run with tsx scripts/test-payout.ts or npm test)
 */
import { calculateOrderPayout, aggregatePayouts, DEFAULT_PAYOUT_CONFIG, getEffectiveReferralRate } from '../src/lib/payout';

console.log('Testing payout calculations...');

const b1 = calculateOrderPayout(100000, true, DEFAULT_PAYOUT_CONFIG);
console.log('Breakdown 100k w/ referral:', b1);
if (b1.grossAmount !== 100000 || b1.referralFee <= 0 || b1.netToSeller <= 0) {
  console.error('FAIL: basic referral breakdown');
  process.exit(1);
}

const b2 = calculateOrderPayout(50000, false, DEFAULT_PAYOUT_CONFIG);
console.log('Breakdown 50k no referral:', b2);
if (b2.referralFee !== 0) {
  console.error('FAIL: no-referral should have 0 referralFee');
  process.exit(1);
}

const agg = aggregatePayouts([b1, b2]);
console.log('Aggregated:', agg);
if (agg.netToSeller !== (b1.netToSeller + b2.netToSeller)) {
  console.error('FAIL: aggregate net mismatch');
  process.exit(1);
}

console.log('Payout lib tests passed (basic)');

// Note: getEffectiveReferralRate requires DB; skipped in this unit test.
