import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { recordGigViewAndMaybeRemind } from '@/lib/gig-view-reminder'

/**
 * POST /api/gigs/[id]/view
 * Records a logged-in buyer's visit to a gig. After multiple visits,
 * sends a one-time reminder (in-app + email/push per prefs).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ ok: true, skipped: 'anonymous' })
    }

    const { id: gigId } = await params
    if (!gigId || typeof gigId !== 'string') {
      return NextResponse.json({ error: 'Gig id required' }, { status: 400 })
    }

    const result = await recordGigViewAndMaybeRemind(userId, gigId)
    return NextResponse.json({ ok: true, ...result })
  } catch (error: unknown) {
    // Never break the gig page for tracking failures (e.g. missing migration)
    console.error('[GigView] record failed:', error)
    return NextResponse.json({ ok: true, skipped: 'error' })
  }
}
