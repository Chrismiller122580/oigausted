"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ToastProvider"

interface Gig {
  id: string
  title: string
  price: number
  category: string
  sellerId?: string
  sellerName?: string
}

interface Order {
  id: string
  gigTitle: string
  price: number
  status: string
  createdAt: string
  buyer?: string
  seller?: string   // Added seller field
}

export default function ProfilePage() {
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    businessName: "",
    nit: "",
    phone: "",
    bio: ""
  })

  const [myGigs, setMyGigs] = useState<Gig[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [mySales, setMySales] = useState<Order[]>([])

  const [stats, setStats] = useState({
    gigsPublished: 0,
    ordersBought: 0,
    totalSpent: 0,
    totalEarned: 0
  })

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr) {
      window.location.href = "/login"
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    setFormData({
      businessName: user.businessName || "",
      nit: user.nit || "",
      phone: user.phone || "",
      bio: user.bio || ""
    })

    // My Gigs (only own)
    const savedGigsStr = localStorage.getItem("oigausted-gigs")
    let userGigs: Gig[] = []
    if (savedGigsStr) {
      const allGigs: Gig[] = JSON.parse(savedGigsStr)
      userGigs = allGigs.filter(g => g.sellerId === user.id)
      setMyGigs(userGigs)
    }

    // My Orders (as buyer)
    const savedOrdersStr = localStorage.getItem("oigausted-orders")
    let orders: Order[] = []
    if (savedOrdersStr) {
      orders = JSON.parse(savedOrdersStr)
      setMyOrders(orders)
    }

    // My Sales (as seller) - using seller field
    let sales: Order[] = []
    if (savedOrdersStr) {
      const allOrders: Order[] = JSON.parse(savedOrdersStr)
      sales = allOrders.filter(o => o.seller === user.name)
      setMySales(sales)
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.price, 0)
    const totalEarned = sales.reduce((sum, order) => sum + order.price, 0)

    setStats({
      gigsPublished: userGigs.length,
      ordersBought: orders.length,
      totalSpent,
      totalEarned
    })
  }, [])

  const saveProfile = () => {
    if (!currentUser) return

    const updatedUser = { 
      ...currentUser, 
      businessName: formData.businessName,
      nit: formData.nit,
      phone: formData.phone,
      bio: formData.bio 
    }

    localStorage.setItem("oigausted-user", JSON.stringify(updatedUser))
    setCurrentUser(updatedUser)
    setIsEditing(false)
    showToast("Perfil actualizado correctamente", "success")
  }

  if (!currentUser) return <div className="container py-12">Cargando perfil...</div>

  return (
    <div className="container mx-auto py-12 px-6 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <div className="w-28 h-28 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-3xl flex items-center justify-center text-6xl flex-shrink-0">
          👤
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold">{currentUser.name}</h1>
              <p className="text-gray-600">{currentUser.email}</p>
            </div>
            <Button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancelar" : "Editar Perfil"}
            </Button>
          </div>
          <span className="inline-block mt-3 px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            {currentUser.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Business Information - Visible only for sellers */}
      {currentUser.role === "seller" && (
        <div className="bg-white border rounded-3xl p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6">Información del Negocio</h2>
          
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Nombre del Negocio / Empresa</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                  placeholder="Ej: Creativos Bucaramanga SAS"
                />
              </div>
              <div>
                <Label>NIT</Label>
                <Input
                  value={formData.nit}
                  onChange={(e) => setFormData({...formData, nit: e.target.value})}
                  placeholder="900123456-7"
                />
              </div>
              <div>
                <Label>Teléfono de Contacto</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="300 123 4567"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descripción del Negocio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Cuéntanos sobre tu experiencia y servicios..."
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-500">Nombre del Negocio</p>
                <p className="font-medium">{formData.businessName || "No registrado"}</p>
              </div>
              <div>
                <p className="text-gray-500">NIT</p>
                <p className="font-medium">{formData.nit || "No registrado"}</p>
              </div>
              <div>
                <p className="text-gray-500">Teléfono</p>
                <p className="font-medium">{formData.phone || "No registrado"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Descripción</p>
                <p className="font-medium">{formData.bio || "Sin descripción"}</p>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="mt-8 flex gap-4">
              <Button onClick={saveProfile}>Guardar Cambios</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            </div>
          )}
        </div>
      )}

      {/* Stats + Gigs + Orders + Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white border rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold text-yellow-600">{myGigs.length}</p>
            <p className="text-sm text-gray-500 mt-2">Gigs Publicados</p>
          </div>
          <div className="bg-white border rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold text-yellow-600">{myOrders.length}</p>
            <p className="text-sm text-gray-500 mt-2">Órdenes Compradas</p>
          </div>
          <div className="bg-white border rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold text-yellow-600">${myOrders.reduce((sum, o) => sum + o.price, 0).toLocaleString("es-CO")}</p>
            <p className="text-sm text-gray-500 mt-2">Total Gastado</p>
          </div>
          <div className="bg-white border rounded-3xl p-8 text-center">
            <p className="text-4xl font-bold text-green-600">${mySales.reduce((sum, o) => sum + o.price, 0).toLocaleString("es-CO")}</p>
            <p className="text-sm text-gray-500 mt-2">Total Ganado</p>
          </div>
        </div>

        {/* My Gigs */}
        <div className="bg-white border rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Mis Gigs Publicados</h2>
            <Link href="/create-gig">
              <Button>+ Nuevo Gig</Button>
            </Link>
          </div>
          {myGigs.length === 0 ? (
            <p className="text-gray-500 py-12 text-center">Aún no has publicado ningún gig.</p>
          ) : (
            <div className="space-y-4">
              {myGigs.map((gig) => (
                <div key={gig.id} className="border rounded-2xl p-5 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium">{gig.title}</h3>
                    <p className="text-sm text-gray-500">{gig.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-600">${gig.price.toLocaleString("es-CO")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Orders & My Sales */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border rounded-3xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Mis Órdenes (Compras)</h2>
            {myOrders.length === 0 ? (
              <p className="text-gray-500 py-12 text-center">Aún no has realizado compras.</p>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/orders/${order.id}`}
                    className="block border rounded-2xl p-5 hover:shadow-md transition-all hover:border-yellow-300"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{order.gigTitle}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-yellow-600">${order.price.toLocaleString("es-CO")}</p>
                        <span className={`inline-block mt-2 px-4 py-1 text-xs rounded-full ${
                          order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-3xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Mis Ventas</h2>
            {mySales.length === 0 ? (
              <p className="text-gray-500 py-12 text-center">Aún no tienes ventas registradas.</p>
            ) : (
              <div className="space-y-4">
                {mySales.map((sale) => (
                  <Link 
                    key={sale.id} 
                    href={`/orders/${sale.id}`}
                    className="block border rounded-2xl p-5 hover:shadow-md transition-all hover:border-yellow-300"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{sale.gigTitle}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(sale.createdAt).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${sale.price.toLocaleString("es-CO")}</p>
                        <span className={`inline-block mt-2 px-4 py-1 text-xs rounded-full ${
                          sale.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {sale.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
