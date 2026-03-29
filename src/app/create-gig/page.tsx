"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateGigPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    deliveryDays: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{type: "success"|"error", message: string} | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus(null)

    // Temporary success simulation
    setTimeout(() => {
      setStatus({ 
        type: "success", 
        message: `✅ Gig "${formData.title}" publicado exitosamente! (Simulación)` 
      })
      setTimeout(() => router.push('/gigs'), 1500)
      setIsSubmitting(false)
    }, 800)
  }

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Publicar un Nuevo Gig</h1>
        <p className="text-muted-foreground">Llena los datos y empieza a ganar dinero</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-10 space-y-8">
        <div>
          <Label htmlFor="title">Título del Gig</Label>
          <Input 
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Ej: Diseño de logo profesional"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea 
            id="description" 
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Describe tu servicio con detalle..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="category">Categoría</Label>
            <select 
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full mt-2 border border-gray-300 rounded-md px-4 py-3"
              required
            >
              <option value="">Selecciona una categoría</option>
              <option value="Diseño Gráfico">Diseño Gráfico</option>
              <option value="Desarrollo Web">Desarrollo Web</option>
              <option value="Marketing Digital">Marketing Digital</option>
              <option value="Asistente Virtual">Asistente Virtual</option>
              <option value="Turismo & Experiencias">Turismo & Experiencias</option>
              <option value="Producción Musical">Producción Musical</option>
              <option value="Otros Servicios">Otros Servicios</option>
            </select>
          </div>

          <div>
            <Label htmlFor="price">Precio base (COP)</Label>
            <Input 
              id="price" 
              type="number" 
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="150000"
              required 
            />
          </div>
        </div>

        <div>
          <Label htmlFor="delivery">Tiempo de entrega (días)</Label>
          <Input 
            id="delivery" 
            type="number" 
            value={formData.deliveryDays}
            onChange={(e) => setFormData({...formData, deliveryDays: e.target.value})}
            placeholder="3"
            required 
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-7 text-lg font-medium"
        >
          {isSubmitting ? "Publicando..." : "Publicar Gig Ahora"}
        </Button>

        {status && (
          <div className={`p-4 rounded-xl text-center font-medium ${
            status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {status.message}
          </div>
        )}
      </form>
    </div>
  )
}
