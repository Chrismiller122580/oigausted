"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DollarSign, Package, Plus, CheckCircle, Trash2, Edit, Upload, Star, TrendingUp, MessageCircle } from "lucide-react"

export default function SellerDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [myGigs, setMyGigs] = useState<any[]>([])
  const [mySales, setMySales] = useState<any[]>([])
  const [businessProfile, setBusinessProfile] = useState({
    logo: "",
    bio: "",
    socialInstagram: "",
    socialFacebook: "",
    socialTwitter: "",
    website: "",
    portfolio: [] as string[]
  })
  const [replyMessage, setReplyMessage] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const currentUserName = session?.user?.name || "Demo Vendedor"

  useEffect(() => {
    // Load gigs
    const savedGigs = localStorage.getItem("oigausted-gigs")
    if (savedGigs) {
      const allGigs = JSON.parse(savedGigs)
      const userGigs = allGigs.filter((g: any) => 
        g.seller.toLowerCase() === currentUserName.toLowerCase()
      )
      setMyGigs(userGigs)
    }

    // Load sales
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) {
      const orders = JSON.parse(savedOrders)
      const sellerSales = orders.filter((o: any) => 
        o.seller.toLowerCase() === currentUserName.toLowerCase()
      )
      setMySales(sellerSales)
    }

    // Load profile
    const savedProfile = localStorage.getItem("oigausted-seller-profile")
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile)
      setBusinessProfile({
        ...parsed,
        portfolio: parsed.portfolio || []
      })
    }
  }, [currentUserName])

  const totalEarnings = mySales.reduce((sum, order) => sum + (order.price || 0), 0)
  const completedSales = mySales.filter(o => o.status === "Completed").length
  const activeOrders = mySales.filter(o => o.status !== "Completed")

  const saveBusinessProfile = () => {
    localStorage.setItem("oigausted-seller-profile", JSON.stringify(businessProfile))
    alert("Perfil guardado correctamente")
  }

  const addPortfolioImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setBusinessProfile(prev => ({
          ...prev,
          portfolio: [...(prev.portfolio || []), ev.target?.result as string]
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const deleteGig = (gigId: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return
    const savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    const updated = savedGigs.filter((g: any) => g.id !== gigId)
    localStorage.setItem("oigausted-gigs", JSON.stringify(updated))
    setMyGigs(myGigs.filter(g => g.id !== gigId))
    alert("Gig eliminado")
  }

  const boostGig = (gigId: string) => {
    alert("🚀 Gig boosted! It will appear at the top of Explore Gigs for 7 days (Demo mode).")
  }

  const sendSellerReply = (orderId: string) => {
    if (!replyMessage.trim()) return

    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const index = savedOrders.findIndex((o: any) => o.id === orderId)
    if (index !== -1) {
      savedOrders[index].messages = [
        ...(savedOrders[index].messages || []),
        {
          from: "Seller",
          text: replyMessage.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
      localStorage.setItem("oigausted-orders", JSON.stringify(savedOrders))
    }

    setMySales(mySales.map(o => 
      o.id === orderId 
        ? { ...o, messages: [...(o.messages || []), { from: "Seller", text: replyMessage.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }] }
        : o
    ))

    setReplyMessage("")
    alert("Respuesta enviada al comprador")
  }

  return (
    <div className="container py-10 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-5xl font-bold">Mi Portal de Vendedor</h1>
          <p className="text-2xl text-gray-600 mt-2">{currentUserName}</p>
        </div>
        <Button onClick={() => router.push("/create-gig")} size="lg" className="bg-yellow-600 hover:bg-yellow-700">
          <Plus className="mr-2" /> Publicar Nuevo Gig
        </Button>
      </div>

      {/* Business Profile */}
      <Card className="mb-12">
        <CardContent className="p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <Star className="text-yellow-500" /> Mi Perfil de Negocio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3 text-center">
              <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden bg-gray-50">
                {businessProfile.logo ? (
                  <img src={businessProfile.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mt-8" />
                )}
              </div>
              <Input type="file" accept="image/*" className="mt-4" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setBusinessProfile({ ...businessProfile, logo: ev.target?.result as string })
                  reader.readAsDataURL(file)
                }
              }} />
            </div>

            <div className="md:col-span-9 space-y-6">
              <div>
                <Label>Bio / Acerca de mí</Label>
                <Textarea value={businessProfile.bio} onChange={(e) => setBusinessProfile({ ...businessProfile, bio: e.target.value })} placeholder="Cuéntales a los compradores sobre tu experiencia..." rows={4} />
              </div>

              <div>
                <Label>Portafolio / Muestras de trabajo</Label>
                <div className="flex gap-4 flex-wrap mt-3">
                  {businessProfile.portfolio.map((img, index) => (
                    <div key={index} className="w-24 h-24 border rounded-lg overflow-hidden">
                      <img src={img} alt="portfolio" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <Input type="file" accept="image/*" onChange={addPortfolioImage} className="mt-3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label>Instagram</Label><Input placeholder="@tuusuario" value={businessProfile.socialInstagram} onChange={(e) => setBusinessProfile({...businessProfile, socialInstagram: e.target.value})} /></div>
                <div><Label>Facebook</Label><Input placeholder="facebook.com/tuusuario" value={businessProfile.socialFacebook} onChange={(e) => setBusinessProfile({...businessProfile, socialFacebook: e.target.value})} /></div>
                <div><Label>Twitter/X</Label><Input placeholder="@tuusuario" value={businessProfile.socialTwitter} onChange={(e) => setBusinessProfile({...businessProfile, socialTwitter: e.target.value})} /></div>
                <div><Label>Sitio Web</Label><Input placeholder="https://tudominio.com" value={businessProfile.website} onChange={(e) => setBusinessProfile({...businessProfile, website: e.target.value})} /></div>
              </div>

              <Button onClick={saveBusinessProfile} className="w-full">Guardar Perfil</Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={`/sellers/${currentUserName.toLowerCase().replace(/\s+/g, '')}`}>Ver mi página pública</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Orders & Chat */}
      <Card className="mb-12">
        <CardContent className="p-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <MessageCircle className="text-blue-600" /> Mensajes de Compradores
          </h2>
          {activeOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tienes mensajes pendientes de compradores.</p>
          ) : (
            <div className="space-y-6">
              {activeOrders.map((order) => (
                <div key={order.id} className="border rounded-2xl p-6">
                  <h3 className="font-medium">{order.gigTitle}</h3>
                  <p className="text-sm text-gray-500">Comprador: {order.buyer}</p>
                  
                  <div className="mt-4 max-h-48 overflow-y-auto bg-gray-50 p-4 rounded-xl text-sm">
                    {(order.messages || []).map((msg: any, i: number) => (
                      <div key={i} className={`mb-3 ${msg.from === "Seller" ? "text-right" : ""}`}>
                        <span className="text-xs text-gray-500">{msg.from} • {msg.time}</span>
                        <p className="mt-1">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Input 
                      value={replyMessage} 
                      onChange={(e) => setReplyMessage(e.target.value)} 
                      placeholder="Escribe tu respuesta al comprador..." 
                      className="flex-1"
                    />
                    <Button onClick={() => sendSellerReply(order.id)}>
                      Enviar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Gigs */}
      <div className="bg-white border rounded-3xl p-10">
        <h2 className="text-3xl font-semibold mb-8">Mis Gigs Publicados</h2>
        {myGigs.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Aún no tienes gigs publicados.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {myGigs.map((gig) => (
              <div key={gig.id} className="border rounded-2xl p-6 hover:shadow-md transition-all">
                <h3 className="font-semibold text-xl">{gig.title}</h3>
                <p className="text-yellow-600 text-2xl font-bold">${gig.price}</p>
                {gig.completionTime && <p className="text-xs text-green-600 mt-1">⏱ {gig.completionTime}</p>}
                <p className="text-sm text-gray-500 mt-4 line-clamp-2">{gig.description}</p>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/gigs/${gig.id}`}>Ver Detalle</Link>
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => router.push(`/create-gig?edit=${gig.id}`)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="outline" onClick={() => boostGig(gig.id)}>
                    🚀 Boost
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteGig(gig.id, gig.title)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
