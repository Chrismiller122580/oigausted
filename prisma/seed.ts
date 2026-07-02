import { PrismaClient } from '@prisma/client';
import { gigCategories } from '../src/lib/gig-categories';
import { isSqliteDatabase } from '../src/lib/utils';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding categories from static definitions (gig-categories.ts)...');

  for (const [index, cat] of gigCategories.entries()) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        icon: cat.icon,
        fields: isSqliteDatabase() ? JSON.stringify(cat.fields) : (cat.fields as Prisma.InputJsonValue),
        order: index,
        isActive: true,
      },
      create: {
        name: cat.name,
        icon: cat.icon,
        fields: isSqliteDatabase() ? JSON.stringify(cat.fields) : (cat.fields as Prisma.InputJsonValue),
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
      supportEmail: 'support@oigagig.com',
      supportPhone: '',
      enableReviews: true,
      enableChat: true,
      maintenanceMode: false,
      maintenanceMessage: "Estamos realizando mejoras. Volveremos pronto.",
      referralsEnabled: true,
      allowNewSignups: true,
      maxUploadSizeMB: 10,
      siteName: 'OigaGIG', // matches BRAND_NAME in src/lib/brand.ts
      siteTagline: 'Conecta con profesionales locales en Colombia',
      logoUrl: '/brand/oiga-gig-marketing.png',
      globalPushNotificationsEnabled: true,
      globalEmailNotificationsEnabled: true,
      maintenanceBypassIps: '',
      wompiRealPaymentsEnabled: false,
      marketingStudioProPriceCOP: 29900,
      marketingStudioFreeMonthlyLimit: 3,
      documentStudioEnabled: true,
      documentPrintShopEmail: 'impresion@oigagig.com',
      documentBasePriceCOP: 15000,
      documentCustomPriceCOP: 25000,
      documentLearnThreshold: 3,
    },
    // Safe select for prod DBs that may be missing later columns (wompiSftp*)
    select: {
      id: true,
      commissionRate: true,
      referralCommissionRate: true,
      minPayoutAmount: true,
      supportEmail: true,
      supportPhone: true,
      enableReviews: true,
      enableChat: true,
      maintenanceMode: true,
      maintenanceMessage: true,
      referralsEnabled: true,
      allowNewSignups: true,
      maxUploadSizeMB: true,
      siteName: true,
      siteTagline: true,
      logoUrl: true,
      globalPushNotificationsEnabled: true,
      globalEmailNotificationsEnabled: true,
      maintenanceBypassIps: true,
      wompiRealPaymentsEnabled: true,
      updatedAt: true,
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
