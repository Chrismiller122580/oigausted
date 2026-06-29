import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { slugify } from '../src/lib/utils'

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

async function resolveUniqueSlug(userId: string, base: string): Promise<string> {
  let candidate = base
  let suffix = 1

  while (true) {
    const exists = await prisma.user.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!exists || exists.id === userId) return candidate
    candidate = `${base}-${suffix++}`
    if (suffix > 50) return `${base}-${Date.now().toString(36)}`
  }
}

async function main() {
  const sellers = await prisma.user.findMany({
    where: {
      role: 'seller',
      OR: [{ slug: null }, { slug: '' }],
      businessName: { not: null },
    },
    select: { id: true, businessName: true, email: true, slug: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${sellers.length} seller(s) without slug`)
  if (sellers.length === 0) return

  let updated = 0
  for (const seller of sellers) {
    const base = slugify(seller.businessName || '')
    if (!base) {
      console.log(`⏭️  Skip ${seller.email || seller.id}: empty slug from businessName`)
      continue
    }

    const slug = await resolveUniqueSlug(seller.id, base)
    console.log(`${dryRun ? '[dry-run] ' : ''}${seller.email || seller.id} → ${slug}`)

    if (!dryRun) {
      await prisma.user.update({
        where: { id: seller.id },
        data: { slug },
      })
    }
    updated++
  }

  console.log(`\n✅ ${dryRun ? 'Would update' : 'Updated'} ${updated} seller slug(s)`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })