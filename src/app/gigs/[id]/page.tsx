interface Props {
  params: Promise<{ id: string }>
}

export default async function GigDetail({ params }: Props) {
  const { id } = await params

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Gig #{id}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Este es el detalle completo del gig (en desarrollo).
        </p>
        
        <div className="bg-white border rounded-2xl p-8">
          <p className="text-muted-foreground">
            Aquí mostraremos precio, descripción completa, reseñas, y botón de compra cuando terminemos esta página.
          </p>
        </div>
      </div>
    </div>
  )
}
