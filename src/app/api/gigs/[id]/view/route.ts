import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { incrementPublicGigView } from '@/lib/gig-interest'
import { recordGigViewAndMaybeRemind } from '@/lib/gig-view-reminder'

/**
 * POST /api/gigs/[id]/view
 * Counts a public page view (anyone) and, for logged-in buyers,
 * records a visit that may trigger a multi-visit reminder.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: gigId } = await params
    if (!gigId || typeof gigId !== 'string') {
      return NextResponse.json({ error: 'Gig id required' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    let publicViewCount: number | null = null
    try {
      publicViewCount = await incrementPublicGigView(gigId)
    } catch (err) {
      console.error('[GigView] public count failed:', err)
    }

    if (!userId) {
      return NextResponse.json({ ok: true, viewCount: publicViewCount ?? 0, skipped: 'anonymous' })
    }

    const result = await recordGigViewAndMaybeRemind(userId, gigId)
    return NextResponse.json({ ok: true, publicViewCount, ...result })
  } catch (error: unknown) {
    console.error('[GigView] record failed:', error)
    return NextResponse.json({ ok: true, skipped: 'error' })
  }
}
