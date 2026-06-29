import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getOrCreateInquiryThread,
  InquiryThreadError,
  listInquiryThreadsForUser,
} from '@/lib/inquiry-queries'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const threads = await listInquiryThreadsForUser(userId)
    return NextResponse.json({ threads })
  } catch (error) {
    console.error('Inquiries GET error:', error)
    return NextResponse.json({ error: 'Error cargando consultas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const gigId = typeof body.gigId === 'string' ? body.gigId.trim() : ''
    if (!gigId) {
      return NextResponse.json({ error: 'gigId es requerido' }, { status: 400 })
    }

    const thread = await getOrCreateInquiryThread(userId, gigId)
    return NextResponse.json({ thread })
  } catch (error) {
    if (error instanceof InquiryThreadError) {
      const status =
        error.code === 'GIG_NOT_FOUND' || error.code === 'GIG_UNAVAILABLE' ? 404 : 400
      return NextResponse.json({ error: error.message, code: error.code }, { status })
    }
    console.error('Inquiries POST error:', error)
    return NextResponse.json({ error: 'Error creando consulta' }, { status: 500 })
  }
}