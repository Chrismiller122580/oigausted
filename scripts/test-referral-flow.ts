/**
 * Test script for referral flow (development only)
 *
 * Usage:
 *   npx tsx scripts/test-referral-flow.ts referrer-email@example.com newuser-email@example.com
 *
 * This will:
 * 1. Find or create a referrer with a referralCode
 * 2. Simulate a user signing up with that ref code
 * 3. Create a paid order for the new seller
 * 4. Show that referral earning was created
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const referrerEmail = process.argv[2]
  const newUserEmail = process.argv[3]

  if (!referrerEmail || !newUserEmail) {
    console.log('Usage: npx tsx scripts/test-referral-flow.ts referrer@email.com newuser@email.com')
    process.exit(1)
  }

  console.log(`\n=== Testing referral flow ===\n`)

  // 1. Get or create referrer
  let referrer = await prisma.user.findUnique({ where: { email: referrerEmail } })
  if (!referrer) {
    console.log('Referrer not found. Creating test referrer...')
    referrer = await prisma.user.create({
      data: { email: referrerEmail, name: 'Test Referrer', role: 'seller' }
    })
  }

  if (!referrer.referralCode) {
    referrer.referralCode = referrer.id.slice(0, 8).toUpperCase()
    await prisma.user.update({
      where: { id: referrer.id },
      data: { referralCode: referrer.referralCode }
    })
  }

  console.log(`Referrer: ${referrer.email} | Code: ${referrer.referralCode}`)

  // 2. Create a test user referred by this person (simulating signup with ?ref=)
  let referredUser = await prisma.user.findUnique({ where: { email: newUserEmail } })
  if (!referredUser) {
    referredUser = await prisma.user.create({
      data: {
        email: newUserEmail,
        name: 'Test Referred Seller',
        role: 'seller',
        referredById: referrer.id,
      }
    })
    console.log(`Created referred user: ${referredUser.email}`)
  } else {
    // Make sure they are linked
    await prisma.user.update({
      where: { id: referredUser.id },
      data: { referredById: referrer.id }
    })
    console.log(`Linked existing user to referrer`)
  }

  // 3. Create a test gig + completed/paid order
  const gig = await prisma.gig.create({
    data: {
      title: 'Test Gig for Referral',
      price: 120000,
      sellerId: referredUser.id,
    }
  })

  const order = await prisma.order.create({
    data: {
      price: 120000,
      status: 'Completed',
      buyerId: referrer.id, // using referrer as buyer for simplicity
      sellerId: referredUser.id,
      gigId: gig.id,
    }
  })

  console.log(`Created test order: ${order.id} for $${order.price}`)

  // 4. Simulate what Wompi webhook does (create referral earning)
  const config = await prisma.platformConfig.findFirst()
  const rate = config?.referralCommissionRate ?? 0.05
  const amount = Math.round(order.price * rate)

  const earning = await prisma.referralEarning.create({
    data: {
      amount,
      rateUsed: rate,
      referrerId: referrer.id,
      orderId: order.id,
      status: 'Pending',
    }
  })

  console.log(`\n✅ Created ReferralEarning: $${amount} for referrer`)
  console.log(`   Referrer now has pending referral earnings.`)

  console.log(`\n=== Done. Check /referrals for ${referrerEmail} ===\n`)
}

main().catch(console.error).finally(() => prisma.$disconnect())