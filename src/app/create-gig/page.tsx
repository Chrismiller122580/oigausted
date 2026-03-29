export default function CreateGigPage() {
  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Publicar un Nuevo Gig</h1>
        <p className="text-muted-foreground">Llena los datos y empieza a ganar dinero</p>
      </div>

      <div className="bg-white border rounded-3xl p-10">
        <p className="text-center text-lg text-gray-600 py-12">
          Formulario de creación de gig (en desarrollo)
        </p>
        <div className="text-center">
          <a 
            href="/gigs" 
            className="inline-block bg-yellow-600 text-white px-8 py-3 rounded-full font-medium hover:bg-yellow-700"
          >
            Volver a Gigs
          </a>
        </div>
      </div>
    </div>
  )
}
