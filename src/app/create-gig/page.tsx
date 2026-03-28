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
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus(null)

    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: formData.price,
          deliveryDays: formData.deliveryDays,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setStatus({ 
          type: "success", 
          message: `✅ Gig "${formData.title}" publicado exitosamente!` 
        })

        // Redirect to gigs page after short delay
        setTimeout(() => {
          router.push('/gigs')
        }, 1200)
      } else {
        setStatus({ 
          type: "error", 
          message: data.error || "Error al publicar el gig" 
        })
      }
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: "Error de conexión. Por favor intenta de nuevo." 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Publicar un Nuevo Gig</h1>
        <p className="text-muted-foreground">Llena los datos y empieza a ganar dinero</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-10 shadow-sm space-y-8">
        <div>
          <Label htmlFor="title">Título del Gig</Label>
          <Input 
            id="title" 
            placeholder="Ej: Diseño de logo profesional" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required 
          />
        </div>

        <div>
          <Label htmlFor="description">Descripción detallada</Label>
          <Textarea 
            id="description" 
            rows={6} 
            placeholder="Describe tu servicio con detalle..." 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="category">Categoría</Label>
            <select 
              id="category"
              className="w-full mt-2 border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:border-yellow-500"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            >
              <option value="">Selecciona una categoría</option>
              <option value="Diseño Gráfico">Diseño Gráfico</option>
              <option value="Desarrollo Web">Desarrollo Web</option>
              <option value="Marketing Digital">Marketing Digital</option>
              <option value="Asistente Virtual">Asistente Virtual</option>
              <option value="Turismo & Experiencias">Turismo & Experiencias</option>
              <option value="Producción Musical">Producción Musical</option>
              <option value="Fotografía">Fotografía</option>
              <option value="Otros Servicios">Otros Servicios</option>
            </select>
          </div>

          <div>
            <Label htmlFor="price">Precio base (COP)</Label>
            <Input 
              id="price" 
              type="number" 
              placeholder="150000" 
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required 
            />
          </div>
        </div>

        <div>
          <Label htmlFor="delivery">Tiempo de entrega (días)</Label>
          <Input 
            id="delivery" 
            type="number" 
            placeholder="3" 
            value={formData.deliveryDays}
            onChange={(e) => setFormData({...formData, deliveryDays: e.target.value})}
            required 
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-7 text-lg font-medium"
        >
          {isSubmitting ? "Publicando Gig..." : "Publicar Gig Ahora"}
        </Button>

        {status && (
          <div className={`p-4 rounded-xl text-center font-medium ${
            status.type === "success" 
              ? "bg-green-50 text-green-700" 
              : "bg-red-50 text-red-700"
          }`}>
            {status.message}
          </div>
        )}
      </form>
    </div>
  )
}
