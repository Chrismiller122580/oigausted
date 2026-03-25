export default function ProfilePage() {
  return (
    <div className="container py-12 max-w-5xl mx-auto px-4">
      <div className="flex flex-col md:flex-row gap-10">
        <div className="md:w-1/3">
          <div className="bg-white border rounded-3xl p-8 text-center sticky top-8">
            <div className="mx-auto w-28 h-28 bg-yellow-100 rounded-full flex items-center justify-center text-6xl mb-6">
              👤
            </div>
            <h2 className="text-3xl font-bold">Chris Miller</h2>
            <p className="text-yellow-600 font-medium mt-1">Comprador / Vendedor</p>
            <div className="mt-8 pt-8 border-t space-y-4 text-left">
              <p><span className="font-medium">Email:</span> chrismiller122580@gmail.com</p>
              <p><span className="font-medium">Miembro desde:</span> Marzo 2026</p>
            </div>
          </div>
        </div>

        <div className="md:w-2/3 space-y-10">
          <div>
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              Mis Gigs Publicados
            </h3>
            <p className="text-muted-foreground">Aún no tienes gigs publicados. ¡Publica tu primer gig!</p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6">Mis Compras Recientes</h3>
            <p className="text-muted-foreground">No tienes compras todavía.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
