"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"

export default function CreateGigForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()

  const editId = searchParams.get("edit")
  const currentSellerName = session?.user?.name || "Ana Seller"

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [completionTime, setCompletionTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (editId) {
      const savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
      const gigToEdit = savedGigs.find((g: any) => g.id === editId)
      if (gigToEdit) {
        setTitle(gigToEdit.title || "")
        setDescription(gigToEdit.description || "")
        setPrice(gigToEdit.price?.toString() || "")
        setCategory(gigToEdit.category || "")
        setCompletionTime(gigToEdit.completionTime || "")
      }
    }
  }, [editId])

  const generateDescription = async () => {
    if (!title.trim()) {
      alert("Por favor escribe un título primero")
      return
    }

    setGenerating(true)

    const templates = [
      `Servicio profesional de ${title.toLowerCase()}. Entrega de alta calidad con atención personalizada y revisiones incluidas. Ideal para negocios en Colombia.`,
      `Ofrezco ${title.toLowerCase()} con resultados excepcionales. Trabajo detallado, rápido y adaptado a tus necesidades. Satisfacción garantizada.`,
      `¿Necesitas ${title.toLowerCase()}? Te entrego un servicio profesional, creativo y eficiente en ${completionTime || "el tiempo acordado"}.`
    ]

    const randomDesc = templates[Math.floor(Math.random() * templates.length)]
    setDescription(randomDesc)

    setGenerating(false)
    alert("¡Descripción generada con IA!")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !price || !category || !completionTime) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setLoading(true)

    const gigData = {
      id: editId || "g" + Date.now(),
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      completionTime,
      seller: currentSellerName,   // ← This is the important fix
      createdAt: new Date().toISOString()
    }

    let gigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")

    if (editId) {
      gigs = gigs.map((g: any) => g.id === editId ? gigData : g)
      alert("¡Gig actualizado exitosamente!")
    } else {
      gigs.push(gigData)
      alert("¡Gig publicado exitosamente!")
    }

    localStorage.setItem("oigausted-gigs", JSON.stringify(gigs))

    setTimeout(() => {
      router.push("/seller")
    }, 800)
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white border rounded-3xl p-10 shadow-sm">
        <h1 className="text-4xl font-bold mb-2">
          {editId ? "Editar Gig" : "Publicar Nuevo Gig"}
        </h1>
        <p className="text-gray-600 mb-8">
          {editId ? "Actualiza los detalles de tu servicio" : "Describe el servicio que ofreces"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label htmlFor="title">Título del Gig *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Diseño de logo profesional moderno"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="description">Descripción detallada *</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={generateDescription}
                disabled={generating || !title.trim()}
              >
                {generating ? "Generando..." : "✨ Generar con IA"}
              </Button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica qué incluye el servicio..."
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">Precio en COP *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="85000"
                required
              />
            </div>

            <div>
              <Label htmlFor="completionTime">Tiempo de entrega *</Label>
              <Select value={completionTime} onValueChange={setCompletionTime} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tiempo de entrega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 día">1 día</SelectItem>
                  <SelectItem value="2-3 días">2-3 días</SelectItem>
                  <SelectItem value="4-7 días">4-7 días</SelectItem>
                  <SelectItem value="1-2 semanas">1-2 semanas</SelectItem>
                  <SelectItem value="2-4 semanas">2-4 semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoría *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diseño">Diseño Gráfico</SelectItem>
                <SelectItem value="desarrollo">Desarrollo Web / Apps</SelectItem>
                <SelectItem value="marketing">Marketing Digital</SelectItem>
                <SelectItem value="redes">Gestión de Redes Sociales</SelectItem>
                <SelectItem value="fotografia">Fotografía y Video</SelectItem>
                <SelectItem value="otros">Otros Servicios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full py-7 text-lg bg-yellow-600 hover:bg-yellow-700"
            disabled={loading}
          >
            {loading ? "Guardando..." : editId ? "Actualizar Gig" : "Publicar Gig"}
          </Button>
        </form>
      </div>
    </div>
  )
}
