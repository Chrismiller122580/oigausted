import { prisma } from '../src/lib/prisma';  // Use our shared instance

async function main() {
  console.log('🌱 Seeding database...');

  // Add your seed data here if needed
  // Example:
  // await prisma.user.upsert({...})

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
