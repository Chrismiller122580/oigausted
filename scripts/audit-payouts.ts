/**
 * CLI payout audit — run against production or local DB.
 *
 * Usage:
 *   npx tsx scripts/audit-payouts.ts
 *   (set -a; source .env.development.local; npx tsx scripts/audit-payouts.ts)
 */
import { runPayoutAudit } from '../src/lib/payout-audit';

async function main() {
  const report = await runPayoutAudit();

  console.log('\n=== Oiga Gig Payout Audit ===\n');
  console.log(`Audited at: ${report.auditedAt}`);
  console.log(`Healthy: ${report.healthy ? 'YES' : 'NO'}\n`);

  console.log('Schema:');
  console.log(`  sellerPayoutAt:    ${report.schema.sellerPayoutAt ? 'OK' : 'MISSING'}`);
  console.log(`  wompiPayoutRef:    ${report.schema.wompiPayoutRef ? 'OK' : 'MISSING'}`);
  console.log(`  payoutBankColumns: ${report.schema.payoutBankColumns ? 'OK' : 'MISSING'}\n`);

  console.log('Seller payouts:');
  console.log(`  Unpaid orders:  ${report.payouts.completedUnpaidCount}`);
  console.log(`  Unpaid net COP: $${report.payouts.completedUnpaidNetCOP.toLocaleString('es-CO')}`);
  console.log(`  Paid orders:    ${report.payouts.completedPaidCount}`);
  if (report.payouts.oldestUnpaidAt) {
    console.log(`  Oldest unpaid:  ${report.payouts.oldestUnpaidAt}`);
  }

  console.log('\nReferral payouts:');
  console.log(`  Pending records: ${report.referrals.pendingCount}`);
  console.log(`  Pending COP:     $${report.referrals.pendingAmountCOP.toLocaleString('es-CO')}`);

  if (report.sellersMissingBank.length > 0) {
    console.log(`\nSellers missing bank details (${report.sellersMissingBank.length}):`);
    for (const seller of report.sellersMissingBank) {
      console.log(
        `  - ${seller.name || seller.email} (${seller.email}): $${seller.pendingNetCOP.toLocaleString('es-CO')} pending, missing: ${seller.missingFields.join(', ')}`
      );
    }
  }

  if (report.blockers.length > 0) {
    console.log('\nBlockers:');
    for (const blocker of report.blockers) {
      console.log(`  ! ${blocker}`);
    }
  }

  console.log('');
  process.exit(report.healthy ? 0 : 1);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(2);
});