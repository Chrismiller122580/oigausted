import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { applyUserProfileUpdate, getUserProfile } from '@/lib/user-profile-update'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await getUserProfile(userId)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error: unknown) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Error al cargar perfil' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const updatedUser = await applyUserProfileUpdate(userId, data)

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error: unknown) {
    console.error('Profile update error:', error)
    const errMsg = error instanceof Error ? error.message : ''
    const message =
      errMsg.includes('column') || errMsg.includes('slug')
        ? 'Error al guardar: la base de datos no tiene todas las columnas de perfil (contacta soporte o ejecuta migraciones).'
        : 'Error al actualizar perfil'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}