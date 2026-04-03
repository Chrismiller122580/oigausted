"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function CreateGigPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [completionTime, setCompletionTime] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (editId) {
      const savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
      const gigToEdit = savedGigs.find((g: any) => g.id === editId)
      if (gigToEdit) {
        setTitle(gigToEdit.title)
        setDescription(gigToEdit.description)
        setPrice(gigToEdit.price.toString())
        setCategory(gigToEdit.category)
        setCompletionTime(gigToEdit.completionTime || "")
        setIsEditing(true)
      }
    }
  }, [editId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !price || !category || !completionTime) {
      alert("Por favor completa todos los campos")
      return
    }

    const gigData = {
      id: editId || "g" + Date.now(),
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      completionTime,
      seller: "Demo Vendedor"
    }

    let savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")

    if (editId) {
      savedGigs = savedGigs.map((g: any) => g.id === editId ? gigData : g)
      alert("Gig actualizado correctamente")
    } else {
      savedGigs.push(gigData)
      alert("Gig publicado exitosamente")
    }

    localStorage.setItem("oigausted-gigs", JSON.stringify(savedGigs))
    router.push("/seller")
  }

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">{isEditing ? "Editar Gig" : "Publicar Nuevo Gig"}</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <Label htmlFor="title">Título del Gig</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Diseño de Logo Profesional" required />
        </div>
        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe el servicio en detalle..." rows={6} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="price">Precio (COP)</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="85000" required />
          </div>
          <div>
            <Label htmlFor="completionTime">Tiempo de Entrega</Label>
            <Select value={completionTime} onValueChange={setCompletionTime} required>
              <SelectTrigger><SelectValue placeholder="Selecciona tiempo de entrega" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1 día">1 día</SelectItem>
                <SelectItem value="2 días">2 días</SelectItem>
                <SelectItem value="3 días">3 días</SelectItem>
                <SelectItem value="5 días">5 días</SelectItem>
                <SelectItem value="1 semana">1 semana</SelectItem>
                <SelectItem value="2 semanas">2 semanas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="diseño">Diseño Gráfico</SelectItem>
              <SelectItem value="video">Edición de Video</SelectItem>
              <SelectItem value="limpieza">Limpieza</SelectItem>
              <SelectItem value="redes">Gestión de Redes Sociales</SelectItem>
              <SelectItem value="otros">Otros Servicios</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full py-7 text-lg bg-yellow-600 hover:bg-yellow-700">
          {isEditing ? "Actualizar Gig" : "Publicar Gig"}
        </Button>
      </form>
    </div>
  )
}
