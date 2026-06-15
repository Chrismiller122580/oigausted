import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables reliably (same pattern as create-admin.ts and other scripts)
const cwd = process.cwd();

const devEnvPath = path.resolve(cwd, '.env.development.local');
if (fs.existsSync(devEnvPath)) {
  dotenv.config({ path: devEnvPath, override: true });
  console.log('📄 Loaded DATABASE_URL from .env.development.local');
}

const defaultEnvPath = path.resolve(cwd, '.env');
if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
}

const prisma = new PrismaClient();

// Debug DB connection (masked)
const rawUrl = process.env.DATABASE_URL || '';
if (rawUrl) {
  try {
    const url = new URL(rawUrl);
    console.log(`🔗 Using database at: ${url.hostname}${url.pathname}`);
  } catch {
    console.log('🔗 DATABASE_URL is set but could not be parsed');
  }
} else {
  console.warn('⚠️  No DATABASE_URL found!');
}

async function main() {
  const force = process.argv.includes('--force');

  console.log('\n🧹 Starting selective order cleanup...');
  console.log('   This will DELETE: Orders, OrderMessages, OrderFiles, Reviews, ReferralEarnings');
  console.log('   This will KEEP:   Users, Gigs, Categories, PlatformConfig, etc.\n');

  // Count before
  const countsBefore = {
    orders: await prisma.order.count(),
    messages: await prisma.orderMessage.count(),
    files: await prisma.orderFile.count(),
    reviews: await prisma.review.count(),
    referralEarnings: await prisma.referralEarning.count(),
  };

  console.log('📊 Current counts:');
  Object.entries(countsBefore).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

  if (countsBefore.orders === 0) {
    console.log('\n✅ No orders found. Nothing to clear.');
    return;
  }

  if (!force) {
    console.log('\n⚠️  DRY RUN: Add --force to actually perform the deletion.');
    console.log('   Example: npx tsx scripts/clear-orders.ts --force\n');
    return;
  }

  console.log('\n🔥 Proceeding with deletion (this cannot be undone)...\n');

  try {
    // Use a transaction for atomicity where possible.
    // Note: deleteMany in sequence inside transaction for safety.
    await prisma.$transaction(async (tx) => {
      // 1. ReferralEarnings (depend on orders)
      const re = await tx.referralEarning.deleteMany({});
      console.log(`   Deleted ${re.count} referralEarnings`);

      // 2. Reviews (depend on orders)
      const rev = await tx.review.deleteMany({});
      console.log(`   Deleted ${rev.count} reviews`);

      // 3. OrderFiles (depend on orders)
      const files = await tx.orderFile.deleteMany({});
      console.log(`   Deleted ${files.count} orderFiles`);

      // 4. OrderMessages (depend on orders)
      const msgs = await tx.orderMessage.deleteMany({});
      console.log(`   Deleted ${msgs.count} orderMessages`);

      // 5. Orders themselves
      const orders = await tx.order.deleteMany({});
      console.log(`   Deleted ${orders.count} orders`);

      // Clear related audit logs for orders/payments (keeps system audits)
      const audits = await tx.auditLog.deleteMany({
        where: {
          OR: [
            { targetType: 'Order' },
            { action: { contains: 'PAYMENT' } },
            { action: { contains: 'ORDER' } },
          ]
        }
      });
      console.log(`   Deleted ${audits.count} order/payment audit logs`);
    });

    console.log('\n✅ Order data cleared successfully.');

    // Count after
    const countsAfter = {
      orders: await prisma.order.count(),
      messages: await prisma.orderMessage.count(),
      files: await prisma.orderFile.count(),
      reviews: await prisma.review.count(),
      referralEarnings: await prisma.referralEarning.count(),
    };

    console.log('\n📊 Counts after cleanup:');
    Object.entries(countsAfter).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

    console.log('\n✅ Users and Gigs data preserved.');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
