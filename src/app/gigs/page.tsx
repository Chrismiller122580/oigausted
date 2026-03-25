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

// More mock gigs for better demo
const mockGigs = [
  {
    id: "1",
    title: "Diseño de logo profesional para tu marca",
    description: "Logo moderno, 3 conceptos + archivos fuente. Entrega en 3 días.",
    price: 150000,
    category: "Diseño Gráfico",
    seller: "JuanPDesign",
    rating: 4.9,
    reviews: 45,
  },
  {
    id: "2",
    title: "Desarrollo de sitio web con Next.js y Tailwind",
    description: "Landing page o e-commerce básico, responsive y optimizado SEO.",
    price: 800000,
    category: "Desarrollo Web",
    seller: "DevBucaramanga",
    rating: 5.0,
    reviews: 32,
  },
  {
    id: "3",
    title: "Gestión mensual de redes sociales + anuncios Meta",
    description: "Plan completo: posts, stories, reels + campañas Facebook/Instagram.",
    price: 450000,
    category: "Marketing Digital",
    seller: "SocialPaisa",
    rating: 4.7,
    reviews: 18,
  },
  {
    id: "4",
    title: "Asistente virtual bilingüe (español-inglés)",
    description: "Gestión de emails, agenda, soporte al cliente. 20 horas/mes.",
    price: 600000,
    category: "Asistente Virtual",
    seller: "AsistentePaisa",
    rating: 4.8,
    reviews: 62,
  },
  {
    id: "5",
    title: "Edición de video para YouTube y TikTok",
    description: "Edición profesional con efectos, música y subtítulos. Entrega en 48 horas.",
    price: 250000,
    category: "Producción Musical",
    seller: "VideoBucara",
    rating: 4.6,
    reviews: 29,
  },
  {
    id: "6",
    title: "Plan de marketing para cafeterías y exportación de café",
    description: "Estrategia completa para aumentar ventas locales e internacionales.",
    price: 950000,
    category: "Consultoría Agro",
    seller: "CafeExportPro",
    rating: 5.0,
    reviews: 14,
  },
]

export default function GigsPage() {
  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
        Explora Gigs en Colombia
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar gigs... (ej: logo, web, redes)"
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        <Select>
          <SelectTrigger className="w-full md:w-52">
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
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Precio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier precio</SelectItem>
            <SelectItem value="low">Hasta $200k</SelectItem>
            <SelectItem value="mid">$200k–$500k</SelectItem>
            <SelectItem value="high">+$500k</SelectItem>
          </SelectContent>
        </Select>

        <Button className="bg-yellow-600 hover:bg-yellow-700">Filtrar</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockGigs.map((gig) => (
          <GigCard key={gig.id} gig={gig} />
        ))}
      </div>
    </div>
  )
}
