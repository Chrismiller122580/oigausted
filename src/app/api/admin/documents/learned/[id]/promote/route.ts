import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { promoteLearnedToTemplate } from '@/lib/documents/templates-db'

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(_req: Request, ctx: RouteCtx) {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await ctx.params
  const template = await promoteLearnedToTemplate(id)
  if (!template) {
    return NextResponse.json({ error: 'Solicitud aprendida no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ template })
}