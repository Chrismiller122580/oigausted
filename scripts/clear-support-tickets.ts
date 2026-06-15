import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables (same as other scripts)
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

async function main() {
  const rawUrl = process.env.DATABASE_URL || '';
  if (rawUrl) {
    try {
      const url = new URL(rawUrl);
      console.log(`🔗 Using database at: ${url.hostname}${url.pathname}`);
    } catch {
      console.log('🔗 DATABASE_URL set');
    }
  }

  console.log('\n🧹 Clearing support tickets...');

  const beforeCount = await prisma.supportTicket.count();
  console.log(`Found ${beforeCount} support tickets.`);

  if (beforeCount === 0) {
    console.log('✅ No support tickets to clear.');
  } else {
    const deleted = await prisma.supportTicket.deleteMany({});
    console.log(`✅ Cleared ${deleted.count} support tickets.`);
  }

  // List demo / all users
  console.log('\n=== Demo / All Users ===');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessName: true,
      createdAt: true,
      referralCode: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (users.length === 0) {
    console.log('No users in database.');
  } else {
    users.forEach((u, i) => {
      console.log(`${i+1}. ${u.email} | role: ${u.role} | name: ${u.name || u.businessName || '(none)'} | created: ${u.createdAt.toISOString().slice(0,10)} | referral: ${u.referralCode || 'none'}`);
    });
    console.log(`\nTotal users: ${users.length}`);
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
