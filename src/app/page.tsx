import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-primary/10 to-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              ¡Oiga usted!
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Encuentra y ofrece servicios locales en Colombia. Gigs rápidos, pagos en COP, todo en un clic.
            </p>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/gigs">Explorar Gigs</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/create-gig">Publicar tu Gig</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-8">
            Categorías Populares
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {["Diseño Gráfico", "Desarrollo Web", "Marketing Digital", "Asistente Virtual", "Turismo", "Producción Musical", "Traducción", "Fotografía", "Redes Sociales", "Consultoría Agro", "Legal", "Otros"].map((cat) => (
              <div
                key={cat}
                className="border rounded-lg p-6 text-center hover:border-primary transition-colors"
              >
                <h3 className="font-medium">{cat}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
