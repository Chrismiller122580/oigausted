import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ResponderEnLaAppPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  const orderId = typeof order === 'string' ? order.replace(/[^a-zA-Z0-9_-]/g, '') : ''
  const chatHref = orderId ? `/orders/${orderId}#order-chat` : '/orders'
  const playUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.oigagig.app'

  return (
    <main className="mx-auto max-w-lg px-5 py-12 text-slate-900">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">OigaGIG</p>
      <h1 className="mt-2 text-2xl font-bold">Responda en el chat de la app</h1>
      <p className="mt-3 text-slate-600">
        Este correo no es el chat. Si responde por email, el comprador no recibe el mensaje y su correo no se comparte.
        Abra el pedido en OigaGIG y escriba allí.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Link href={chatHref} className="rounded-xl bg-orange-500 px-4 py-3 text-center font-semibold text-white">
          Abrir el chat del pedido
        </Link>
        <a href={playUrl} className="rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold">
          Abrir en la app de Android
        </a>
      </div>
    </main>
  )
}
