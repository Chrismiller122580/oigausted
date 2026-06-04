/**
 * Basic test for payout lib (run with tsx scripts/test-payout.ts)
 */
import { calculateOrderPayout, aggregatePayouts, DEFAULT_PAYOUT_CONFIG } from '../src/lib/payout';

console.log('Testing payout calculations...');

const breakdown = calculateOrderPayout(100000, true, DEFAULT_PAYOUT_CONFIG);
console.log('Breakdown for 100k with referral:', breakdown);

const aggregated = aggregatePayouts([breakdown, calculateOrderPayout(50000, false)]);
console.log('Aggregated:', aggregated);

console.log('Payout lib tests passed (basic)');
