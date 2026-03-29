"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateGigPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Diseño Gráfico",
    price: ""
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.price) {
      alert("Por favor llena todos los campos")
      return
    }

    setLoading(true)

    const newGig = {
      id: Date.now().toString(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      price: parseFloat(form.price)
    }

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    localStorage.setItem("oigausted-gigs", JSON.stringify([newGig, ...existing]))

    alert(`✅ ¡Gig "${form.title}" creado exitosamente!`)

    setTimeout(() => {
      router.push("/gigs")
    }, 1000)
  }

  return (
    <div className="container mx-auto max-w-2xl py-12 px-6">
      <h1 className="text-4xl font-bold text-center mb-8">Publicar Nuevo Gig</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-10 space-y-8">
        <div>
          <Label>Título</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            placeholder="Ej: Diseño de logo profesional"
            required
          />
        </div>

        <div>
          <Label>Descripción</Label>
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            placeholder="Describe tu servicio..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Categoría</Label>
            <select 
              value={form.category}
              onChange={(e) => setForm({...form, category: e.target.value})}
              className="w-full border rounded-md p-3 mt-1"
            >
              <option>Diseño Gráfico</option>
              <option>Desarrollo Web</option>
              <option>Marketing Digital</option>
              <option>Fotografía</option>
              <option>Otros Servicios</option>
            </select>
          </div>

          <div>
            <Label>Precio (COP)</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm({...form, price: e.target.value})}
              placeholder="250000"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full py-7 text-lg bg-yellow-600 hover:bg-yellow-700"
        >
          {loading ? "Publicando..." : "Publicar Gig"}
        </Button>
      </form>
    </div>
  )
}
