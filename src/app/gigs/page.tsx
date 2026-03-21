import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"
import { GigCard } from "@/components/GigCard"

// Mock data for beta testing
const mockGigs = [
  {
    id: "1",
    title: "Diseño de logo profesional para tu marca",
    description: "Logo moderno, 3 conceptos + archivos fuente. Entrega en 3 días. Incluye versiones en color y blanco/negro.",
    price: 150000,
    category: "Diseño Gráfico",
    seller: "JuanPDesign",
    rating: 4.9,
    reviews: 45,
  },
  {
    id: "2",
    title: "Desarrollo de sitio web con Next.js y Tailwind",
    description: "Landing page o e-commerce básico, responsive, SEO optimizado, integración con Wompi o PayU.",
    price: 800000,
    category: "Desarrollo Web",
    seller: "DevBucaramanga",
    rating: 5.0,
    reviews: 32,
  },
  {
    id: "3",
    title: "Gestión mensual de redes sociales + anuncios Meta",
    description: "Plan completo: 20 posts, stories, reels + campañas Facebook/Instagram. Reporte semanal.",
    price: 450000,
    category: "Marketing Digital",
    seller: "SocialPaisa",
    rating: 4.7,
    reviews: 18,
  },
]

export default function GigsPage() {
  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
        Explora Gigs en Colombia
      </h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar gigs... (ej: logo, web, redes)"
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        <Select>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="diseno">Diseño Gráfico</SelectItem>
            <SelectItem value="web">Desarrollo Web</SelectItem>
            <SelectItem value="marketing">Marketing Digital</SelectItem>
            <SelectItem value="asistente">Asistente Virtual</SelectItem>
            <SelectItem value="turismo">Turismo</SelectItem>
            <SelectItem value="musica">Producción Musical</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Precio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier precio</SelectItem>
            <SelectItem value="low">Hasta $200k</SelectItem>
            <SelectItem value="mid">$200k–$500k</SelectItem>
            <SelectItem value="high">+$500k</SelectItem>
          </SelectContent>
        </Select>

        <Button className="w-full md:w-auto">Filtrar</Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockGigs.map((gig) => (
          <GigCard key={gig.id} gig={gig} />
        ))}
      </div>
    </div>
  )
}
