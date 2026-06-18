import { NextRequest, NextResponse } from 'next/server'

/** @deprecated Use NextAuth credentials or Google OAuth at /login instead. */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is disabled. Use /login with NextAuth.' },
    { status: 410 }
  )
}