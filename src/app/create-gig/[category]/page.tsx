"use client"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCategory } from "@/lib/categories"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"

export default function CreateGigByCategory() {
  const { category } = useParams() as { category: string }
  const router = useRouter()
  const { data: session } = useSession()

  const cat = getCategory(category)

  if (!cat) {
    return <div className="p-12 text-center text-red-600">Categoría "{category}" no encontrada.</div>
  }

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState(cat.basePriceMin.toString())
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, any>>({})
  const [customNotes, setCustomNotes] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("3 días")   // Safe default

  const calculateTotal = () => {
    let total = parseFloat(price) || cat.basePriceMin
    cat.addOns.forEach((addon) => {
      const value = selectedAddOns[addon.id]
      if (value) {
        if (addon.type === "number") total += (Number(value) || 0) * addon.price
        else if (addon.type === "checkbox" && value === true) total += addon.price
      }
    })
    return Math.round(total)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      alert("Por favor completa título y descripción")
      return
    }

    const gigData = {
      id: "g" + Date.now(),
      title: title.trim(),
      description: description.trim(),
      price: calculateTotal(),
      category: cat.name,
      seller: session?.user?.name || "Vendedor Demo",
      sellerEmail: session?.user?.email || "demo@seller.com",
      deliveryTime,                    // Saved safely
      addOns: selectedAddOns,
      customNotes: customNotes.trim(),
      createdAt: new Date().toISOString(),
    }

    const existing = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    localStorage.setItem("oigausted-gigs", JSON.stringify([...existing, gigData]))

    alert(`¡Gig de ${cat.name} creado exitosamente!`)
    router.push("/seller")
  }

  return (
    <div className="container max-w-3xl mx-auto py-12 px-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        ← Volver a categorías
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <h1 className="text-4xl font-bold mb-2">{cat.name}</h1>
          <p className="text-gray-600 mb-8">{cat.description}</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <Label>Título del Gig</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Limpieza profunda de 3 habitaciones" required />
            </div>

            <div>
              <Label>Descripción detallada</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Describe el servicio..." required />
            </div>

            {/* Safe Delivery Time */}
            <div>
              <Label>Tiempo de entrega estimado</Label>
              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 día">1 día</SelectItem>
                  <SelectItem value="2-3 días">2-3 días</SelectItem>
                  <SelectItem value="4-7 días">4-7 días</SelectItem>
                  <SelectItem value="1-2 semanas">1-2 semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Precio base (COP)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>

            <div className="space-y-6">
              <h3 className="font-semibold text-lg">Opciones adicionales</h3>
              {cat.addOns.map((addon) => (
                <Card key={addon.id} className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label>{addon.label}</Label>
                      {addon.unit && <p className="text-sm text-gray-500">({addon.unit})</p>}
                    </div>
                    <span className="text-yellow-600">+${addon.price.toLocaleString()}</span>
                  </div>

                  {addon.type === "number" && (
                    <Input 
                      type="number" 
                      placeholder={`Cantidad de ${addon.unit || ""}`}
                      className="mt-3"
                      onChange={(e) => setSelectedAddOns({ ...selectedAddOns, [addon.id]: e.target.value })}
                    />
                  )}

                  {addon.type === "checkbox" && (
                    <input 
                      type="checkbox" 
                      className="mt-3 scale-125"
                      onChange={(e) => setSelectedAddOns({ ...selectedAddOns, [addon.id]: e.target.checked })}
                    />
                  )}

                  {addon.type === "select" && addon.options && (
                    <Select onValueChange={(val) => setSelectedAddOns({ ...selectedAddOns, [addon.id]: val })}>
                      <SelectTrigger className="mt-3">
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {addon.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </Card>
              ))}
            </div>

            <div>
              <Label>Notas adicionales</Label>
              <Textarea value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} placeholder="Cualquier detalle extra..." />
            </div>

            <Button type="submit" size="lg" className="w-full py-7 text-lg">
              Publicar Gig — Total: ${calculateTotal().toLocaleString()} COP
            </Button>
          </form>
        </div>

        {/* Live Summary */}
        <div className="lg:col-span-2">
          <Card className="p-8 bg-yellow-50 border-yellow-200 sticky top-8">
            <h3 className="font-semibold text-xl mb-6">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Precio base</span>
                <span>${parseFloat(price).toLocaleString() || cat.basePriceMin.toLocaleString()} COP</span>
              </div>
              {cat.addOns.map((addon) => {
                const value = selectedAddOns[addon.id]
                if (!value) return null
                let addonPrice = 0
                if (addon.type === "number") addonPrice = (Number(value) || 0) * addon.price
                else if (addon.type === "checkbox" && value === true) addonPrice = addon.price
                return (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span>{addon.label}</span>
                    <span className="text-green-600">+${addonPrice.toLocaleString()}</span>
                  </div>
                )
              })}
              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-yellow-600">${calculateTotal().toLocaleString()} COP</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
