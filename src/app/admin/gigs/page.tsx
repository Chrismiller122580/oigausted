"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Save, X, Search } from "lucide-react"

interface Gig {
  id: string
  title: string
  description?: string
  price: number
  category?: string
  completionTime?: string
  imageUrl?: string
  createdAt: string
  seller: {
    id: string
    name: string
    email: string
    businessName?: string
  }
}

export default function AdminGigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([])
  const [editingGig, setEditingGig] = useState<Gig | null>(null)
  const [formData, setFormData] = useState<Partial<Gig>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGigs()
  }, [])

  useEffect(() => {
    const filtered = gigs.filter(gig => 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.seller.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredGigs(filtered)
  }, [gigs, searchTerm])

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs")
      const data = await res.json()
      setGigs(data.gigs || [])
    } catch (error) {
      console.error("Failed to fetch gigs:", error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (gig: Gig) => {
    setEditingGig(gig)
    setFormData({ ...gig })
  }

  const cancelEdit = () => {
    setEditingGig(null)
    setFormData({})
  }

  const saveEdit = async () => {
    if (!editingGig?.id) return

    try {
      const res = await fetch(`/api/gigs/${editingGig.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          category: formData.category,
          completionTime: formData.completionTime,
        }),
      })

      if (res.ok) {
        fetchGigs()
        cancelEdit()
        alert("✅ Gig actualizado correctamente")
      } else {
        alert("Error al actualizar el gig")
      }
    } catch (error) {
      alert("Error de conexión")
    }
  }

  const deleteGig = async (id: string) => {
    if (!confirm("¿Eliminar este gig permanentemente? Esta acción no se puede deshacer.")) return

    try {
      const res = await fetch(`/api/gigs/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchGigs()
        alert("✅ Gig eliminado correctamente")
      } else {
        alert("Error al eliminar el gig")
      }
    } catch (error) {
      alert("Error de conexión")
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Cargando gigs...</div>
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Gestión de Gigs</h1>
          <p className="text-gray-400 mt-1">Administra todos los servicios publicados en la plataforma</p>
        </div>
        <div className="text-gray-400">Total: {gigs.length} gigs</div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <Input
          placeholder="Buscar por título, vendedor o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500"
        />
      </div>

      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Gigs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium">Título</th>
                <th className="text-left p-4 text-gray-300 font-medium">Vendedor</th>
                <th className="text-left p-4 text-gray-300 font-medium">Precio</th>
                <th className="text-left p-4 text-gray-300 font-medium">Categoría</th>
                <th className="text-left p-4 text-gray-300 font-medium">Fecha</th>
                <th className="text-right p-4 text-gray-300 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredGigs.map((gig) => (
                <tr key={gig.id} className="hover:bg-gray-800/70 transition-colors">
                  <td className="p-4 font-medium text-white">
                    {editingGig?.id === gig.id ? (
                      <Input
                        value={formData.title || ""}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    ) : gig.title}
                  </td>
                  <td className="p-4">
                    <div className="text-white font-medium">{gig.seller.name || "Sin nombre"}</div>
                    <div className="text-xs text-gray-500">{gig.seller.email}</div>
                  </td>
                  <td className="p-4 text-white font-medium">
                    {editingGig?.id === gig.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price || ""}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="bg-gray-800 border-gray-600 text-white w-28"
                      />
                    ) : (
                      `$${gig.price.toLocaleString('es-CO')}`
                    )}
                  </td>
                  <td className="p-4 text-gray-200">
                    {editingGig?.id === gig.id ? (
                      <Input
                        value={formData.category || ""}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    ) : (gig.category || "-")}
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(gig.createdAt).toLocaleDateString('es-CO')}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    {editingGig?.id === gig.id ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={saveEdit} 
                          className="bg-green-600 hover:bg-green-700 text-white font-medium px-5"
                        >
                          <Save size={16} className="mr-1" /> Guardar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={cancelEdit} 
                          className="border-gray-600 hover:bg-gray-800 text-gray-300 hover:text-white px-5"
                        >
                          <X size={16} className="mr-1" /> Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Blue Edit Button */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => startEdit(gig)}
                          className="border-blue-600 text-blue-400 hover:bg-blue-950 hover:text-blue-300 px-5"
                        >
                          <Edit2 size={16} className="mr-1" /> Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => deleteGig(gig.id)}
                          className="px-5"
                        >
                          <Trash2 size={16} className="mr-1" /> Eliminar
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredGigs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron gigs con ese término de búsqueda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
