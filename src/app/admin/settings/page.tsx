"use client"
export default function AdminSettings() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">Platform Settings</h1>
        <div className="bg-gray-900 border border-gray-700 rounded-3xl p-12">
          <div className="space-y-10">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Comisión de la Plataforma</h3>
              <p className="text-gray-400">Actual: 12% por transacción</p>
              <p className="text-sm text-gray-500 mt-2">Puedes cambiarla en producción.</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Reglas de Pago</h3>
              <p className="text-gray-400">Pago automático a vendedores después de que el comprador marque "Recibido"</p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Idioma y Región</h3>
              <p className="text-gray-400">Español (Colombia) - Configuración predeterminada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
