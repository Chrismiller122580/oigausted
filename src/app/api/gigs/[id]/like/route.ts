import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGigInterest, toggleGigLike } from '@/lib/gig-interest'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    const { id: gigId } = await params
    if (!gigId) return NextResponse.json({ error: 'Gig id required' }, { status: 400 })
    const interest = await getGigInterest(gigId, session?.user?.id)
    return NextResponse.json(interest)
  } catch (error) {
    console.error('[GigLike] GET failed:', error)
    return NextResponse.json({ viewCount: 0, likeCount: 0, liked: false })
  }
}

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Inicie sesión para indicar que le gusta esta idea' }, { status: 401 })
    }

    const { id: gigId } = await params
    if (!gigId) return NextResponse.json({ error: 'Gig id required' }, { status: 400 })

    const result = await toggleGigLike(userId, gigId)
    if (result.skipped === 'own gig') {
      return NextResponse.json({ error: 'No puede marcar su propio gig', ...result }, { status: 400 })
    }
    if (result.skipped === 'gig unavailable') {
      return NextResponse.json({ error: 'Servicio no disponible', ...result }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('[GigLike] POST failed:', error)
    return NextResponse.json({ error: 'No se pudo guardar su opinión' }, { status: 500 })
  }
}
