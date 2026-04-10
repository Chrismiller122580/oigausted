"use client"
export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white pt-8">
      <div className="container mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">Panel de Administrador</h1>
          <p className="text-gray-400 text-xl">Gestiona usuarios, gigs, pagos y la plataforma completa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="text-4xl font-bold">1,284</div>
            <div className="text-gray-400">Usuarios totales</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="text-4xl font-bold">342</div>
            <div className="text-gray-400">Gigs publicados</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="text-4xl font-bold">$12.4M</div>
            <div className="text-gray-400">Volumen este mes</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="text-4xl font-bold">47</div>
            <div className="text-gray-400">Soporte pendiente</div>
          </div>
        </div>
      </div>
    </div>
  )
}
