import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { touchUserPresence } from '@/lib/update-user-presence'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await touchUserPresence(userId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error de presencia' }, { status: 500 })
  }
}