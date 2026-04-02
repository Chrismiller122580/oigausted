"use client"
export default function AdminReports() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">Reports</h1>
        <div className="bg-gray-900 border border-gray-700 rounded-3xl p-12 text-center">
          <p className="text-3xl text-gray-400 mb-6">📈 Reportes y Analíticas</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-gray-800 rounded-2xl p-8">
              <p className="text-xl">Ventas del Mes</p>
              <p className="text-5xl font-bold text-green-400 mt-4">$1,245,000</p>
            </div>
            <div className="bg-gray-800 rounded-2xl p-8">
              <p className="text-xl">Usuarios Activos</p>
              <p className="text-5xl font-bold text-blue-400 mt-4">248</p>
            </div>
          </div>
          <p className="text-gray-500 mt-16">Reportes completos con gráficos se agregarán en la próxima actualización.</p>
        </div>
      </div>
    </div>
  )
}
