/**
 * Look up payout status for a user by email.
 *
 * Usage:
 *   npx tsx scripts/lookup-user-payouts.ts cortlandblackstone@gmail.com
 */
import { lookupUserPayoutsByEmail } from '../src/lib/payout-audit';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/lookup-user-payouts.ts <email>');
    process.exit(1);
  }

  const result = await lookupUserPayoutsByEmail(email);

  console.log('\n=== User Payout Lookup ===\n');
  console.log(JSON.stringify(result, null, 2));
  console.log('');
  process.exit(result.found ? 0 : 1);
}

main().catch((err) => {
  console.error('Lookup failed:', err);
  process.exit(2);
});