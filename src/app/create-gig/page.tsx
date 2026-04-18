"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import Image from "next/image"

// Centralized categories - this will be the single source of truth
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
  "Cuidado Holístico y Bienestar",
  "Marketing Digital y Redes Sociales",
  "Desarrollo Web y Tiendas Online",
  "Edición de Video y Contenido Audiovisual",
  "Asistente Virtual y Soporte Administrativo",
  "Redacción de Contenidos y Copywriting",
  "Reparaciones y Mantenimiento del Hogar",
  "Clases de Idiomas y Tutorías Online",
  "Diseño de Interiores y Arquitectura",
  "Gestión de Eventos y Organización de Fiestas"
]

const categoryEmojis: Record<string, string> = {
  "Limpieza de Hogar y Oficinas": "🧹",
  "Música y DJ para Eventos": "🎧",
  "Asesoría Legal y Tributaria": "⚖️",
  "Diseño Gráfico y Logos": "🖼️",
  "Cocina Casera y Catering": "🍲",
  "Fotografía y Video": "📸",
  "Transporte y Mudanzas": "🚚",
  "Belleza y Maquillaje a Domicilio": "💄",
  "Clases Particulares": "📚",
  "Artesanías y Productos Hechos a Mano": "🧶",
  "Cuidado Holístico y Bienestar": "🧘",
  "Marketing Digital y Redes Sociales": "📱",
  "Desarrollo Web y Tiendas Online": "💻",
  "Edición de Video y Contenido Audiovisual": "🎥",
  "Asistente Virtual y Soporte Administrativo": "📋",
  "Redacción de Contenidos y Copywriting": "✍️",
  "Reparaciones y Mantenimiento del Hogar": "🔧",
  "Clases de Idiomas y Tutorías Online": "🗣️",
  "Diseño de Interiores y Arquitectura": "🏠",
  "Gestión de Eventos y Organización de Fiestas": "🎉",
}

export default function CreateGigPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    deliveryTime: "",
    tailoredFields: {} as Record<string, any>
  })

  const [selectedCategory, setSelectedCategory] = useState("")

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no puede superar 5MB")
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setFormData(prev => ({
      ...prev,
      category,
      tailoredFields: {}
    }))
  }

  const updateTailoredField = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tailoredFields: { ...prev.tailoredFields, [key]: value }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.price || !formData.category || !formData.deliveryTime) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    if (!session?.user?.email) {
      toast.error("Debes estar logueado para crear un gig")
      return
    }

    setLoading(true)
    let imageUrl = null

    try {
      // Upload image if selected
      if (imageFile) {
        const form = new FormData()
        form.append("file", imageFile)

        const uploadRes = await fetch("/api/upload", { 
          method: "POST", 
          body: form 
        })

        if (uploadRes.ok) {
          const data = await uploadRes.json()
          imageUrl = data.url
        } else {
          const errorData = await uploadRes.json().catch(() => ({}))
          toast.error(errorData.error || "Error al subir la imagen")
        }
      }

      // Create gig
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          imageUrl,
          fields: formData.tailoredFields
        }),
      })

      if (res.ok) {
        toast.success("¡Gig creado exitosamente!")
        router.push("/seller")
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || "Error al crear el gig")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">Crear Nuevo Gig</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload - Improved */}
          <div>
            <label className="block text-sm font-medium mb-2">Imagen del Gig (opcional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center hover:border-orange-300 transition">
              {imagePreview ? (
                <div className="relative w-full h-64 mx-auto rounded-2xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="absolute top-3 right-3"
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                  >
                    Cambiar imagen
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block py-12">
                  <div className="text-gray-500">
                    <div className="text-6xl mb-4">📸</div>
                    <p className="font-medium">Haz clic para subir una imagen</p>
                    <p className="text-sm mt-1">PNG, JPG o JPEG • Máx 5MB</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Título del Gig *</label>
            <Input 
              value={formData.title} 
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} 
              placeholder="Ej: Diseño de logo profesional" 
              required 
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Precio (COP) *</label>
            <Input 
              type="number" 
              value={formData.price} 
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} 
              placeholder="50000" 
              required 
            />
          </div>

          {/* Delivery Time */}
          <div>
            <label className="block text-sm font-medium mb-2">Tiempo de entrega *</label>
            <select
              value={formData.deliveryTime}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
              className="w-full border rounded-3xl px-6 py-4 text-base"
              required
            >
              <option value="">Selecciona el tiempo de entrega</option>
              <option value="1 día">1 día</option>
              <option value="2 días">2 días</option>
              <option value="3 días">3 días</option>
              <option value="5 días">5 días</option>
              <option value="7 días">7 días</option>
              <option value="14 días">14 días</option>
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-4">Categoría del servicio *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center hover:shadow-md ${
                    selectedCategory === cat 
                      ? "border-emerald-500 bg-emerald-50 shadow-md" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-5xl mb-3">{categoryEmojis[cat]}</div>
                  <p className="font-medium text-sm leading-tight">{cat}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Descripción general</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe el servicio en detalle..."
              rows={6}
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full py-8 text-xl font-semibold"
          >
            {loading ? "Creando gig..." : "Publicar Gig"}
          </Button>
        </form>
      </div>
    </div>
  )
}
