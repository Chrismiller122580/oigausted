"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"

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
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.price || !formData.category) {
      toast.error("Por favor completa los campos obligatorios")
      return
    }

    setLoading(true)
    let imageUrl = null

    try {
      // Upload image if selected
      if (imageFile) {
        toast.loading("Subiendo imagen...", { id: "upload" })

        const form = new FormData()
        form.append("file", imageFile)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: form,
        })

        const uploadData = await uploadRes.json()

        if (uploadRes.ok && uploadData.url) {
          imageUrl = uploadData.url
          toast.success("Imagen subida correctamente", { id: "upload" })
          console.log("Image URL received:", imageUrl)
        } else {
          toast.error(uploadData.error || "Error al subir imagen", { id: "upload" })
          console.error("Upload failed:", uploadData)
        }
      }

      // Create the gig
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          imageUrl: imageUrl,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("¡Gig creado exitosamente!")
        router.push("/seller")
      } else {
        toast.error(data.error || "Error al crear el gig")
      }
    } catch (err: any) {
      console.error("Create gig error:", err)
      toast.error("Error inesperado al crear el gig")
    } finally {
      setLoading(false)
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="absolute top-3 right-3"
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                  >
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
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Diseño de logo profesional"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el servicio en detalle..."
              rows={5}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Precio (COP) *</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="50000"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Categoría *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border rounded-3xl px-6 py-4 text-base"
              required
            >
              <option value="">Selecciona una categoría</option>
              {["Limpieza de Hogar y Oficinas", "Música y DJ para Eventos", "Asesoría Legal y Tributaria", "Diseño Gráfico y Logos", "Cocina Casera y Catering", "Fotografía y Video", "Transporte y Mudanzas", "Belleza y Maquillaje a Domicilio"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Completion Time */}
          <div>
            <label className="block text-sm font-medium mb-2">Tiempo de entrega aproximado</label>
            <Input
              value={formData.completionTime}
              onChange={(e) => setFormData({ ...formData, completionTime: e.target.value })}
              placeholder="Ej: 3 días"
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
