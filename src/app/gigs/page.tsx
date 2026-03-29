export default function GigsPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Explorar Gigs</h1>
      
      <div className="max-w-md mx-auto text-center py-20 border-2 border-dashed border-gray-300 rounded-3xl">
        <p className="text-xl text-gray-500 mb-6">
          Aún no hay gigs publicados
        </p>
        <a 
          href="/create-gig" 
          className="inline-block bg-yellow-600 text-white px-8 py-4 rounded-full font-medium hover:bg-yellow-700 transition-colors"
        >
          Publica tu primer Gig →
        </a>
      </div>
    </div>
  )
}
