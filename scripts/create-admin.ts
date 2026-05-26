import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
