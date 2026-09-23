import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyAdminFromDb } from '@/lib/admin-auth'
import { notifyBuyerRefundResult, refundWompiForOrder } from '@/lib/server/wompi-refund'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const isAdmin = session.user.role === 'admin' ? await verifyAdminFromDb(userId) : false
  if (!isAdmin) {
    return NextResponse.json({ error: 'Solo un admin puede devolver un pago' }, { status: 403 })
  }

  const { id: orderId } = await params
  const result = await refundWompiForOrder(orderId, userId)
  await notifyBuyerRefundResult(orderId, result)
  return NextResponse.json({
    success: result.success,
    refund: result,
  }, { status: result.attempted ? 200 : 400 })
}
