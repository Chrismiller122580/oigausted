export default function GigDetail({ params }: { params: { id: string } }) {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Gig #{params.id}</h1>
      <p className="text-lg text-muted-foreground">
        Este es el detalle del gig (en desarrollo).
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        Próximamente aquí: descripción completa, paquetes (Básico, Estándar, Premium),
        precio por paquete, reseñas de compradores, botón "Comprar ahora", chat con vendedor, imágenes.
      </p>
    </div>
  )
}
