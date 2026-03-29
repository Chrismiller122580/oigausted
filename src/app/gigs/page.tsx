export default function GigsPage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Explorar Gigs</h1>
        <p className="text-gray-600">Encuentra servicios locales en Colombia</p>
      </div>

      <div className="max-w-md mx-auto text-center py-20 border-2 border-dashed border-gray-300 rounded-3xl">
        <p className="text-2xl text-gray-400 mb-6">🌵</p>
        <p className="text-xl text-gray-500 mb-8">
          Aún no hay gigs publicados
        </p>
        <a 
          href="/create-gig" 
          className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-10 py-4 rounded-full font-medium transition-colors"
        >
          Sé el primero en publicar un gig
        </a>
      </div>
    </div>
  )
}
