/**
 * One-time scrub: find sellers whose businessName is an email address (or exactly
 * their account email), clear the businessName, and notify them they must pick a
 * real business name.
 *
 * Run: npx tsx scripts/scrub-email-business-names.ts
 * Dry run: npx tsx scripts/scrub-email-business-names.ts --dry-run
 */
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { isEmailAsBusinessName } from '../src/lib/business-name'

const cwd = process.cwd()
const devEnvPath = path.resolve(cwd, '.env.development.local')
if (fs.existsSync(devEnvPath)) {
  dotenv.config({ path: devEnvPath, override: true })
  console.log('📄 Loaded DATABASE_URL from .env.development.local')
}
const defaultEnvPath = path.resolve(cwd, '.env')
if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath })
}

const prisma = new PrismaClient()
const dryRun = process.argv.includes('--dry-run')

async function main() {
  const sellers = await prisma.user.findMany({
    where: {
      role: 'seller',
      businessName: { not: null },
    },
    select: { id: true, email: true, businessName: true, name: true },
  })

  const offenders = sellers.filter((s) =>
    isEmailAsBusinessName(s.businessName, s.email)
  )

  console.log(`Found ${offenders.length} seller(s) using email as business name`) 
  if (offenders.length === 0) return

  let updated = 0
  for (const seller of offenders) {
    console.log(
      `${dryRun ? '[dry-run] ' : ''}${seller.email || seller.id} → businessName "${seller.businessName}" cleared`
    )
    if (!dryRun) {
      await prisma.user.update({
        where: { id: seller.id },
        data: { businessName: null, slug: null },
      })

      try {
        await prisma.notification.create({
          data: {
            userId: seller.id,
            category: 'system',
            type: 'in_app',
            title: 'Actualiza el nombre de tu negocio',
            message:
              'No puedes usar tu correo electrónico como nombre de negocio. Elegimos uno por ti: por favor entra a Mi Negocio y pon un nombre comercial real para que los clientes te encuentren.',
            link: '/seller/profile',
            data: {
              kind: 'email_as_business_name_scrubbed',
              previousBusinessName: seller.businessName,
            },
          },
        })
      } catch (e) {
        console.error(`Failed to notify ${seller.email || seller.id}:`, e)
      }
    }
    updated++
  }

  console.log(`\n✅ ${dryRun ? 'Would scrub' : 'Scrubbed'} ${updated} seller(s)`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
