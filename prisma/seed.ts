import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  // Create Demo Seller with exact UUID used in auth.ts
  const demoSeller = await prisma.user.upsert({
    where: { email: 'seller@demo.com' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'seller@demo.com',
      name: 'Seller Demo',
      role: 'seller',
      businessName: 'Mi Negocio Local',
      city: 'Bucaramanga',
    },
  });

  console.log('✅ Demo Seller created/updated with ID:', demoSeller.id);

  // Optional: Create demo buyer too
  await prisma.user.upsert({
    where: { email: 'buyer@demo.com' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'buyer@demo.com',
      name: 'Buyer Demo',
      role: 'buyer',
    },
  });

  console.log('✅ Demo Buyer created/updated');
}

main()
  .then(() => console.log('🎉 Seeding completed successfully!'))
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
