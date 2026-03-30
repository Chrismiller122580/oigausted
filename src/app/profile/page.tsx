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
}

interface Order {
  id: string
  gigTitle: string
  price: number
  status: string
  createdAt: string
}

export default function ProfilePage() {
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [profileImage, setProfileImage] = useState<string>("/logo.png") // default

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

    if (user.profileImage) setProfileImage(user.profileImage)

    // Load gigs, orders, sales...
    const savedGigsStr = localStorage.getItem("oigausted-gigs")
    let userGigs: Gig[] = []
    if (savedGigsStr) {
      const allGigs: Gig[] = JSON.parse(savedGigsStr)
      userGigs = allGigs.filter(g => g.sellerId === user.id)
      setMyGigs(userGigs)
    }

    const savedOrdersStr = localStorage.getItem("oigausted-orders")
    let orders: Order[] = []
    if (savedOrdersStr) {
      orders = JSON.parse(savedOrdersStr)
      setMyOrders(orders)
      const sales = orders.filter(o => o.seller === user.name)
      setMySales(sales)
    }

    const totalSpent = orders.reduce((sum, order) => sum + order.price, 0)
    const totalEarned = mySales.reduce((sum, order) => sum + order.price, 0)

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
      bio: formData.bio,
      profileImage 
    }

    localStorage.setItem("oigausted-user", JSON.stringify(updatedUser))
    setCurrentUser(updatedUser)
    setIsEditing(false)
    showToast("Perfil actualizado correctamente", "success")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string)
          showToast("Imagen actualizada (simulación)", "success")
        }
      }
      reader.readAsDataURL(file)
    }
  }

  if (!currentUser) return <div className="container py-12">Cargando perfil...</div>

  return (
    <div className="container mx-auto py-12 px-6 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
        <div className="relative">
          <img 
            src={profileImage} 
            alt="Profile" 
            className="w-28 h-28 object-cover rounded-3xl border-4 border-white shadow-md"
          />
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full cursor-pointer">
              Cambiar
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
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

      {/* Business Info for Sellers */}
      {currentUser.role === "seller" && (
        <div className="bg-white border rounded-3xl p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-6">Información del Negocio</h2>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Nombre del Negocio</Label>
                <Input value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} />
              </div>
              <div>
                <Label>NIT</Label>
                <Input value={formData.nit} onChange={(e) => setFormData({...formData, nit: e.target.value})} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <Label>Descripción del Negocio</Label>
                <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={4} />
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

      {/* Rest of profile content remains the same as before */}
      {/* ... (stats, gigs, orders, sales) ... */}
    </div>
  )
}
