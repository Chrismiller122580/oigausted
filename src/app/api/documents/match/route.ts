import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { findSimilarDocument } from '@/lib/documents/learning'

/** Check if a custom description matches an existing template or learned document. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 })
  }

  const body = await req.json()
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  if (description.length < 5) {
    return NextResponse.json({ error: 'Describe el documento (mínimo 5 caracteres)' }, { status: 400 })
  }

  const match = await findSimilarDocument(description)
  return NextResponse.json({ match })
}