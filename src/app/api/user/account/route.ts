import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteUserAccount } from '@/lib/delete-user-account'
import { getRequestIp } from '@/lib/rate-limit'

/**
 * DELETE /api/user/account
 *
 * Body:
 *   confirm: must be "ELIMINAR" (case-insensitive)
 *   deleteAllData?: boolean — also wipe personal data (PII, notifications, etc.)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let body: { confirm?: string; deleteAllData?: boolean } = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const confirm = (body.confirm || '').trim().toUpperCase()
    if (confirm !== 'ELIMINAR') {
      return NextResponse.json(
        {
          error:
            'Para confirmar, escribe ELIMINAR en el campo de confirmación.',
        },
        { status: 400 }
      )
    }

    const deleteAllData = Boolean(body.deleteAllData)
    const result = await deleteUserAccount(userId, {
      deleteAllData,
      ipAddress: getRequestIp(req.headers),
      userAgent: req.headers.get('user-agent'),
    })

    if (!result.ok) {
      const status =
        result.code === 'OPEN_ORDERS'
          ? 409
          : result.code === 'LAST_ADMIN'
            ? 403
            : result.code === 'NOT_FOUND'
              ? 404
              : 400
      return NextResponse.json(
        {
          error: result.message,
          code: result.code,
          openOrders: result.openOrders,
        },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      mode: result.mode,
      deleteAllData: result.deleteAllData,
      softDeletedGigs: result.softDeletedGigs,
      message: deleteAllData
        ? 'Cuenta y datos personales eliminados.'
        : 'Cuenta eliminada. Ya no podrás iniciar sesión.',
    })
  } catch (error) {
    console.error('[api/user/account] DELETE failed:', error)
    return NextResponse.json(
      { error: 'No se pudo eliminar la cuenta. Intenta de nuevo o contacta soporte.' },
      { status: 500 }
    )
  }
}
