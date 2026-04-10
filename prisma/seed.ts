import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const demoUsers = [
    { id: "1", name: "Chris Buyer", email: "buyer@demo.com", password: "123", role: "buyer" },
    { id: "2", name: "Ana Seller", email: "seller@demo.com", password: "123", role: "seller" },
    { id: "3", name: "Admin", email: "admin@demo.com", password: "123", role: "admin" },
    { id: "4", name: "Chris Miller", email: "chris@demo.com", password: "123", role: "admin" },
  ]

  for (const userData of demoUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
        password: userData.password,
      },
      create: userData,
    })
    console.log(`✅ Seeded/Updated: ${userData.email} (ID: ${userData.id})`)
  }

  console.log('🎉 All demo users seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
