"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"

const categories = [
  "Limpieza de Hogar y Oficinas",
  "Música y DJ para Eventos",
  "Asesoría Legal y Tributaria",
  "Diseño Gráfico y Logos",
  "Cocina Casera y Catering",
  "Fotografía y Video",
  "Transporte y Mudanzas",
  "Belleza y Maquillaje a Domicilio",
  "Clases Particulares",
  "Artesanías y Productos Hechos a Mano",
  "Cuidado Holístico y Bienestar"
]

export default function CreateGigPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    completionTime: "",
    // Tailored fields will be stored here dynamically
    tailoredFields: {} as Record<string, any>
  })

  const [selectedCategory, setSelectedCategory] = useState("")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setFormData(prev => ({ ...prev, category }))
  }

  const updateTailoredField = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tailoredFields: {
        ...prev.tailoredFields,
        [key]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.price || !formData.category) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    setLoading(true)

    try {
      let imageUrl = null

      if (imageFile) {
        const form = new FormData()
        form.append("file", imageFile)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: form })
        if (uploadRes.ok) {
          const data = await uploadRes.json()
          imageUrl = data.url
        }
      }

      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          imageUrl,
          fields: formData.tailoredFields   // Store tailored fields here
        }),
      })

      if (res.ok) {
        toast.success("¡Gig creado exitosamente!")
        router.push("/seller")
      } else {
        toast.error("Error al crear el gig")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error al crear el gig")
    } finally {
      setLoading(false)
    }
  }

  // Render tailored fields based on category
  const renderTailoredFields = () => {
    if (!selectedCategory) return null

    switch (selectedCategory) {
      case "Fotografía y Video":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de servicio</label>
              <Input placeholder="Sesión fotográfica, video corporativo, etc." 
                onChange={(e) => updateTailoredField("photoType", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Equipo incluido</label>
              <Input placeholder="Cámara, dron, luces..." 
                onChange={(e) => updateTailoredField("equipment", e.target.value)} />
            </div>
          </div>
        )

      case "Música y DJ para Eventos":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de evento</label>
              <Input placeholder="Boda, fiesta, corporativo..." 
                onChange={(e) => updateTailoredField("eventType", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duración aproximada</label>
              <Input placeholder="4 horas, toda la noche..." 
                onChange={(e) => updateTailoredField("duration", e.target.value)} />
            </div>
          </div>
        )

      case "Limpieza de Hogar y Oficinas":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de limpieza</label>
              <Input placeholder="General, profunda, post-obra..." 
                onChange={(e) => updateTailoredField("cleanType", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Frecuencia</label>
              <Input placeholder="Una vez, semanal, mensual..." 
                onChange={(e) => updateTailoredField("frequency", e.target.value)} />
            </div>
          </div>
        )

      // Add more categories here as needed
      default:
        return (
          <div className="text-sm text-gray-500 py-4">
            No hay campos adicionales para esta categoría aún.
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">Crear Nuevo Gig</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Imagen del Gig (opcional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center">
              {imagePreview ? (
                <div className="relative w-full h-64 mx-auto rounded-2xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button type="button" variant="outline" className="absolute top-3 right-3" onClick={() => { setImageFile(null); setImagePreview(null) }}>
                    Cambiar
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block py-12">
                  <div className="text-gray-500">
                    <div className="text-6xl mb-4">📸</div>
                    <p className="font-medium">Haz clic para subir una imagen</p>
                    <p className="text-sm mt-1">PNG, JPG o JPEG • Máx 5MB</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Título del Gig *</label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ej: Diseño de logo profesional" required />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Precio (COP) *</label>
            <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="50000" required />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Categoría *</label>
            <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full border rounded-3xl px-6 py-4 text-base" required>
              <option value="">Selecciona una categoría</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tailored Fields - Appear after category is selected */}
          {selectedCategory && (
            <div className="border-l-4 border-emerald-500 pl-6 py-4 bg-emerald-50 rounded-r-3xl">
              <h3 className="font-semibold mb-4">Campos específicos para {selectedCategory}</h3>
              {renderTailoredFields()}
            </div>
          )}

          {/* Common Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Descripción general</label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe el servicio..." rows={5} />
          </div>

          <Button type="submit" disabled={loading} className="w-full py-8 text-xl font-semibold">
            {loading ? "Creando gig..." : "Publicar Gig"}
          </Button>
        </form>
      </div>
    </div>
  )
}
