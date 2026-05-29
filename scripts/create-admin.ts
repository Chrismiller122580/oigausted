import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables reliably for Codespaces + Production DB workflow
const cwd = process.cwd();

// Try .env.development.local first (preferred when working against prod DB from Codespaces)
const devEnvPath = path.resolve(cwd, '.env.development.local');
if (fs.existsSync(devEnvPath)) {
  dotenv.config({ path: devEnvPath, override: true });
  console.log('📄 Loaded DATABASE_URL from .env.development.local');
}

// Also load regular .env as fallback (without overriding)
const defaultEnvPath = path.resolve(cwd, '.env');
if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
}

const prisma = new PrismaClient();

// Debug: Show which database we are connecting to (masked for safety)
const rawUrl = process.env.DATABASE_URL || '';
if (rawUrl) {
  try {
    const url = new URL(rawUrl);
    console.log(`🔗 Using database at: ${url.hostname}${url.pathname}`);
  } catch {
    console.log('🔗 DATABASE_URL is set but could not be parsed');
  }
} else {
  console.warn('⚠️  No DATABASE_URL found in environment!');
}

async function main() {
  const email = process.argv[2] || 'admin@oigagig.co.com';
  const password = process.argv[3] || 'ChangeMe123!';

  if (password === 'ChangeMe123!') {
    console.warn('⚠️  Using default password. Please change it immediately after creation.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      email: email.toLowerCase(),
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ Admin user created/updated successfully:');
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   Password: ${password}   ← Change this immediately!`);
  console.log('');
  console.log('✅ This admin can now log in from ANY environment using the same production database:');
  console.log('   - Local development (npm run dev:codespaces)');
  console.log('   - Vercel Preview deployments');
  console.log('   - Production (https://oigagig.com)');
  console.log('');
  console.log('Just go to /login and use the email + password above.');
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
