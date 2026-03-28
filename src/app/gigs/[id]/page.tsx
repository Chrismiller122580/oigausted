export default function GigDetail({ params }: { params: { id: string } }) {
  const { id } = params

  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Gig #{id}</h1>
      
      <div className="bg-white border rounded-3xl p-10">
        <p className="text-lg text-muted-foreground mb-6">
          Este es el detalle completo del gig #{id}.
        </p>
        <p className="text-muted-foreground">
          (Página en desarrollo — pronto mostraremos precio completo, descripción larga, 
          reseñas, vendedor y botón de compra)
        </p>
      </div>
    </div>
  )
}
