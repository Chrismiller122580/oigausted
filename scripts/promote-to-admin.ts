import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables reliably for prod DB
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
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: tsx scripts/promote-to-admin.ts your-real-gmail@gmail.com');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();

  console.log(`🔍 Looking for user: ${normalizedEmail}`);

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email: normalizedEmail },
      data: { role: 'admin' },
    });
    console.log('✅ User promoted to admin:');
    console.log(`   Email: ${updated.email}`);
    console.log(`   Role:  ${updated.role}`);
    console.log(`   ID:    ${updated.id}`);
  } else {
    // Create the user as admin (they can later link Google)
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: email.split('@')[0],
        role: 'admin',
        // No password — they will sign in via Google
      },
    });
    console.log('✅ New admin user created (Google sign-in ready):');
    console.log(`   Email: ${created.email}`);
    console.log(`   Role:  ${created.role}`);
  }

  console.log('\nYou can now sign in with this Gmail via Google OAuth on the site.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
