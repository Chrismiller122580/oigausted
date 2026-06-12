import { PrismaClient } from '@prisma/client';
import { gigCategories } from '../src/lib/gig-categories';
import { toPrismaJson } from '../src/lib/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding categories from static definitions (gig-categories.ts)...');

  for (const [index, cat] of gigCategories.entries()) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        icon: cat.icon,
        fields: toPrismaJson(cat.fields),
        order: index,
        isActive: true,
      },
      create: {
        name: cat.name,
        icon: cat.icon,
        fields: toPrismaJson(cat.fields),
        description: null,
        order: index,
        isActive: true,
      },
    });
  }

  console.log(`✅ Seeded ${gigCategories.length} categories.`);

  // Ensure the PlatformConfig singleton exists. This guarantees that maintenanceMode,
  // wompiRealPaymentsEnabled, commissions, etc. can be reliably toggled and saved from
  // the first moment (prevents the old "update on missing row silently fails" bug).
  console.log('🌱 Ensuring PlatformConfig singleton (maintenance / payments / branding defaults)...');
  await prisma.platformConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      commissionRate: 0.12,
      referralCommissionRate: 0.05,
      minPayoutAmount: 50000,
      supportEmail: 'support@support.oigagig.com',
      supportPhone: '',
      enableReviews: true,
      enableChat: true,
      maintenanceMode: false,
      maintenanceMessage: "Estamos realizando mejoras. Volveremos pronto.",
      referralsEnabled: true,
      allowNewSignups: true,
      maxUploadSizeMB: 10,
      siteName: 'OigaUsted',
      siteTagline: 'Conecta con profesionales locales en Colombia',
      logoUrl: null,
      globalPushNotificationsEnabled: true,
      globalEmailNotificationsEnabled: true,
      maintenanceBypassIps: '',
      wompiRealPaymentsEnabled: false,
    },
  });
  console.log('✅ PlatformConfig singleton ensured.');

  console.log("🌱 Seeding complete — no users or sample data seeded.");

  // The database starts completely empty.
  // Sign up via the app UI (/signup) to create accounts.
  // To create an admin (works in dev, codespaces, or production against the real DB):
  //   npm run create-admin admin@your-email.com YourSecurePassword123!
  //
  // You can also set ADMIN_EMAILS in env and log in with Google to auto-promote admins.
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
