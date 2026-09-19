import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminFromDb } from '@/lib/admin-auth'
import { listingTextChanged, scrubListingText, scrubListingValue } from '@/lib/contact-moderation'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await requireAdminFromDb()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const gigs = await prisma.gig.findMany({
    select: { id: true, title: true, description: true, fields: true, addons: true },
  })

  let updated = 0
  const samples: { id: string; title: string }[] = []

  for (const gig of gigs) {
    const title = scrubListingText(gig.title) || gig.title
    const description = gig.description ? scrubListingText(gig.description) : gig.description
    let fields = gig.fields
    let addons = gig.addons
    try {
      if (typeof fields === 'string' && fields.trim()) {
        fields = JSON.stringify(scrubListingValue(JSON.parse(fields)))
      }
    } catch {
      if (typeof fields === 'string') fields = scrubListingText(fields)
    }
    try {
      if (typeof addons === 'string' && addons.trim()) {
        addons = JSON.stringify(scrubListingValue(JSON.parse(addons)))
      }
    } catch {
      if (typeof addons === 'string') addons = scrubListingText(addons)
    }

    const changed =
      listingTextChanged(gig.title, title) ||
      listingTextChanged(gig.description, description) ||
      listingTextChanged(gig.fields, fields as string | null) ||
      listingTextChanged(gig.addons, addons as string | null)

    if (!changed) continue

    await prisma.gig.update({
      where: { id: gig.id },
      data: { title, description, fields: fields as string | null, addons: addons as string | null },
    })
    updated += 1
    if (samples.length < 25) samples.push({ id: gig.id, title })
  }

  return NextResponse.json({ scanned: gigs.length, updated, samples })
}
