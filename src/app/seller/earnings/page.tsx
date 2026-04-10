"use client"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function SellerEarnings() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="mb-10">
          <Link href="/seller" className="text-orange-600 hover:underline flex items-center gap-2">
            ← Volver al Dashboard
          </Link>
          <h1 className="text-4xl font-bold mt-4">Mis Ganancias</h1>
          <p className="text-gray-600">Resumen de ingresos como vendedor</p>
        </div>

        <div className="bg-white rounded-3xl border p-10 shadow-sm">
          <div className="text-center mb-10">
            <div className="text-6xl font-bold text-green-600">$8.450.000</div>
            <p className="text-gray-500 mt-2">Ingresos totales estimados</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="font-semibold text-lg mb-4">Este Mes</h3>
              <div className="text-4xl font-bold text-green-600">$2.340.000</div>
              <p className="text-sm text-gray-500 mt-2">12 gigs completados</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="font-semibold text-lg mb-4">Pendiente de Pago</h3>
              <div className="text-4xl font-bold text-amber-600">$890.000</div>
              <p className="text-sm text-gray-500 mt-2">3 gigs en proceso</p>
            </div>
          </div>

          <div className="mt-12 text-center text-gray-500">
            <p>Próximamente: Historial detallado de pagos y retiros</p>
          </div>
        </div>
      </div>
    </div>
  )
}
