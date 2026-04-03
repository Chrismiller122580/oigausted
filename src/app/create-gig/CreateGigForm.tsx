"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ToastProvider"

export default function CreateGigForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { showToast } = useToast()

  const editId = searchParams.get("edit")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [completionTime, setCompletionTime] = useState("")
  const [loading, setLoading] = useState(false)

  // Load existing gig if in edit mode
  useEffect(() => {
    if (editId) {
      const savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
      const gigToEdit = savedGigs.find((g: any) => g.id === editId)
      if (gigToEdit) {
        setTitle(gigToEdit.title)
        setDescription(gigToEdit.description || "")
        setPrice(gigToEdit.price.toString())
        setCategory(gigToEdit.category)
        setCompletionTime(gigToEdit.completionTime || "")
      }
    }
  }, [editId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !price || !category || !completionTime) {
      showToast("Por favor completa todos los campos", "error")
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
      seller: "Current Seller", // In real app this would come from session
      createdAt: new Date().toISOString()
    }

    let gigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")

    if (editId) {
      gigs = gigs.map((g: any) => g.id === editId ? gigData : g)
      showToast("¡Gig actualizado correctamente!", "success")
    } else {
      gigs.push(gigData)
      showToast("¡Gig publicado exitosamente!", "success")
    }

    localStorage.setItem("oigausted-gigs", JSON.stringify(gigs))

    setTimeout(() => {
      router.push("/seller")
    }, 800)
  }

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <div className="bg-white border rounded-3xl p-10">
        <h1 className="text-4xl font-bold mb-2">
          {editId ? "Editar Gig" : "Publicar Nuevo Gig"}
        </h1>
        <p className="text-gray-600 mb-8">
          {editId ? "Actualiza la información de tu servicio" : "Describe el servicio que ofreces"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <Label htmlFor="title">Título del Gig</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Diseño de logo profesional"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe detalladamente el servicio..."
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">Precio (COP)</Label>
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
              <Label htmlFor="completionTime">Tiempo de entrega</Label>
              <Select value={completionTime} onValueChange={setCompletionTime} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 día">1 día</SelectItem>
                  <SelectItem value="2-3 días">2-3 días</SelectItem>
                  <SelectItem value="4-7 días">4-7 días</SelectItem>
                  <SelectItem value="1-2 semanas">1-2 semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diseño">Diseño Gráfico</SelectItem>
                <SelectItem value="desarrollo">Desarrollo Web</SelectItem>
                <SelectItem value="marketing">Marketing Digital</SelectItem>
                <SelectItem value="redes">Gestión de Redes Sociales</SelectItem>
                <SelectItem value="fotografia">Fotografía</SelectItem>
                <SelectItem value="otros">Otros Servicios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full py-7 text-lg" disabled={loading}>
            {loading ? "Publicando..." : editId ? "Actualizar Gig" : "Publicar Gig"}
          </Button>
        </form>
      </div>
    </div>
  )
}
