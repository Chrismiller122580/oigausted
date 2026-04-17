"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { gigCategories } from "@/lib/gig-categories"

export default function CreateGigForm({ initialCategory }: { initialCategory?: string }) {
  const { data: session } = useSession()
  const router = useRouter()

  const [categorySlug, setCategorySlug] = useState(initialCategory || "")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [addons, setAddons] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const category = gigCategories.find(c => c.slug === categorySlug)

  useEffect(() => {
    if (initialCategory) {
      setCategorySlug(initialCategory)
    }
  }, [initialCategory])

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleAddonChange = (id: string, checked: boolean) => {
    setAddons(prev => ({ ...prev, [id]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return

    setLoading(true)
    setError("")

    const gigData = {
      title: formData.title || "",
      description: formData.description || "",
      price: Number(formData.price) || 0,
      category: category.name,
      completionTime: formData.completionTime || "",
      fields: formData,
      addons: Object.keys(addons).filter(k => addons[k]),
      sellerId: session?.user?.id || "unknown",
      sellerName: session?.user?.name || "Vendedor",
    }

    try {
      const res = await fetch("/api/gigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gigData),
      })

      if (res.ok) {
        alert("✅ Gig publicado correctamente!")
        router.push("/seller")
      } else {
        const data = await res.json()
        setError(data.error || "Error al publicar el gig")
      }
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (!category) {
    return <div className="p-8 text-center">Cargando categoría...</div>
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Crear Gig: {category.name}</h1>
        <p className="text-gray-600">{category.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Common fields */}
        <div>
          <Label htmlFor="title">Título del Gig *</Label>
          <Input
            id="title"
            value={formData.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description">Descripción *</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={5}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="price">Precio (COP) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price || ""}
            onChange={(e) => handleChange("price", e.target.value)}
            required
            className="mt-1"
          />
        </div>

        {/* Dynamic fields from category */}
        {category.fields.map((field) => (
          <div key={field.key}>
            <Label htmlFor={field.key}>{field.label} {field.required && "*"}</Label>
            {field.type === "number" && (
              <Input
                id={field.key}
                type="number"
                value={formData[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                className="mt-1"
              />
            )}
            {field.type === "textarea" && (
              <Textarea
                id={field.key}
                value={formData[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                required={field.required}
                className="mt-1"
              />
            )}
            {field.type === "select" && field.options && (
              <Select value={formData[field.key] || ""} onValueChange={(v) => handleChange(field.key, v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.type === "checkbox" && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="w-4 h-4"
                />
                <span>{field.label}</span>
                {field.extraPrice && <span className="text-sm text-gray-500">(+${field.extraPrice.toLocaleString()})</span>}
              </label>
            )}
          </div>
        ))}

        {/* Addons */}
        {category.addons && category.addons.length > 0 && (
          <div>
            <Label className="block mb-3">Opciones adicionales</Label>
            <div className="space-y-3">
              {category.addons.map((addon) => (
                <label key={addon.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!addons[addon.id]}
                    onChange={(e) => handleAddonChange(addon.id, e.target.checked)}
                  />
                  <span>{addon.label}</span>
                  {addon.extraPrice && <span className="text-sm text-gray-500">(+${addon.extraPrice.toLocaleString()})</span>}
                </label>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" className="w-full py-7 text-lg" disabled={loading}>
          {loading ? "Publicando Gig..." : "Publicar Gig"}
        </Button>

        {error && <p className="text-red-600 text-center">{error}</p>}
      </form>
    </div>
  )
}
