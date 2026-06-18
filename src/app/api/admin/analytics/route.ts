import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildAdminAnalyticsPayload } from '@/lib/admin-analytics'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const payload = await buildAdminAnalyticsPayload()
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Error obteniendo analytics' }, { status: 500 })
  }
}