import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin(email: string, password: string) {
  console.log(`\n=== Testing login for: ${email} ===`);
  
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    console.log('❌ RESULT: No user found');
    return;
  }

  console.log('✅ User found:', { id: user.id, email: user.email, role: user.role, hasPassword: !!user.password });

  if (!user.password) {
    console.log('❌ RESULT: User has no password set');
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  console.log('bcrypt.compare result:', isValid);

  if (isValid) {
    console.log('✅✅✅ SUCCESS: Password matches. This user should be able to log in.');
  } else {
    console.log('❌ RESULT: Password mismatch (bcrypt.compare returned false)');
  }
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not set');
    process.exit(1);
  }
  console.log('Using DATABASE_URL host:', new URL(DATABASE_URL).host);

  // Test a real admin account (example)
  await testLogin('admin@oigagig.co.com', 'OigagigAdmin2026!');

  // Test a non-existing user
  await testLogin('ghost@example.com', 'test1234');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
