export default function ProfilePage() {
  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Mi Perfil</h1>
      
      <div className="bg-white border rounded-3xl p-10">
        <p className="text-center text-lg text-gray-600 py-8">
          Perfil de usuario (en desarrollo)
        </p>
        
        <div className="grid grid-cols-2 gap-4 mt-8">
          <a href="/gigs" className="block text-center py-6 border rounded-2xl hover:bg-gray-50">
            Mis Gigs Publicados
          </a>
          <a href="/gigs" className="block text-center py-6 border rounded-2xl hover:bg-gray-50">
            Mis Compras
          </a>
        </div>
      </div>
    </div>
  )
}
