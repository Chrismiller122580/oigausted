import { NextResponse } from 'next/server'
import { requireAdminPanelSession } from '@/lib/admin-auth'
import { buildAdminAnalyticsPayload } from '@/lib/admin-analytics'

export async function GET() {
  try {
    const session = await requireAdminPanelSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const payload = await buildAdminAnalyticsPayload()
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Error obteniendo analytics' }, { status: 500 })
  }
}