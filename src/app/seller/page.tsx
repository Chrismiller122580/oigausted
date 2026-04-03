"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Upload, Trash2 } from "lucide-react"

export default function SellerDashboard() {
  const { data: session } = useSession()
  const router = useRouter()

  const [myGigs, setMyGigs] = useState<any[]>([])
  const [earnings, setEarnings] = useState(0)
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [businessProfile, setBusinessProfile] = useState({
    bio: "",
    portfolio: [] as string[],
    logo: ""
  })

  const currentUserName = session?.user?.name || "Ana Seller"
  const usernameSlug = currentUserName.toLowerCase().replace(/\s+/g, '')

  useEffect(() => {
    const savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    
    const sellerGigs = savedGigs.filter((g: any) => 
      g.seller && g.seller.toLowerCase().includes(currentUserName.toLowerCase())
    )
    
    setMyGigs(sellerGigs)

    const totalEarnings = sellerGigs.length * 45000
    setEarnings(totalEarnings)

    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const sellerOrders = savedOrders.filter((o: any) => 
      o.seller && o.seller.toLowerCase().includes(currentUserName.toLowerCase())
    )
    setActiveOrders(sellerOrders)

    const savedProfile = localStorage.getItem(`businessProfile_${usernameSlug}`)
    if (savedProfile) {
      setBusinessProfile(JSON.parse(savedProfile))
    }
  }, [currentUserName, usernameSlug])

  const saveBusinessProfile = () => {
    localStorage.setItem(`businessProfile_${usernameSlug}`, JSON.stringify(businessProfile))
    alert("Perfil de negocio guardado correctamente")
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBusinessProfile(prev => ({ ...prev, logo: event.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const addPortfolioImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBusinessProfile(prev => ({
          ...prev,
          portfolio: [...prev.portfolio, event.target?.result as string]
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removePortfolioImage = (index: number) => {
    setBusinessProfile(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }))
  }

  const deleteGig = (id: string) => {
    if (!confirm("¿Eliminar este gig permanentemente?")) return

    let gigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    gigs = gigs.filter((g: any) => g.id !== id)
    localStorage.setItem("oigausted-gigs", JSON.stringify(gigs))

    setMyGigs(myGigs.filter(g => g.id !== id))
    alert("Gig eliminado correctamente")
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">My Seller Dashboard</h1>
          <p className="text-gray-600">Welcome, {currentUserName}</p>
        </div>
        <Button onClick={() => router.push("/create-gig")} className="bg-yellow-600 hover:bg-yellow-700">
          + Publish New Gig
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Published Gigs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-yellow-600">{myGigs.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Estimated Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-600">${earnings.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{activeOrders.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Business Profile */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Logo de tu negocio</Label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
            {businessProfile.logo && (
              <img src={businessProfile.logo} alt="logo" className="mt-4 w-32 h-32 object-cover rounded-xl border" />
            )}
          </div>

          <div>
            <Label>Bio / Acerca de tu negocio</Label>
            <Textarea
              value={businessProfile.bio}
              onChange={(e) => setBusinessProfile({ ...businessProfile, bio: e.target.value })}
              placeholder="Cuéntanos sobre tu experiencia y qué te hace único..."
              rows={4}
            />
          </div>

          <div>
            <Label>Portafolio (imágenes de trabajos anteriores)</Label>
            <input type="file" accept="image/*" onChange={addPortfolioImage} className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
            <div className="flex flex-wrap gap-4 mt-4">
              {businessProfile.portfolio.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img} alt="portfolio" className="w-32 h-32 object-cover rounded-xl border" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePortfolioImage(index)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={saveBusinessProfile} className="w-full">
            Guardar Perfil de Negocio
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href={`/sellers/${usernameSlug}`}>Ver mi página pública</Link>
          </Button>
        </CardContent>
      </Card>

      {/* My Published Gigs */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">My Published Gigs</h2>
        
        {myGigs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">You don't have any gigs published yet.</p>
            <Button onClick={() => router.push("/create-gig")} className="mt-6">
              Create my first Gig
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGigs.map((gig) => (
              <Card key={gig.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{gig.title}</CardTitle>
                  <p className="text-sm text-gray-500">${gig.price.toLocaleString()} COP</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 line-clamp-3">{gig.description}</p>
                  {gig.completionTime && (
                    <p className="text-xs text-gray-500 mt-3">Delivery: {gig.completionTime}</p>
                  )}
                </CardContent>
                <CardFooter className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/create-gig?edit=${gig.id}`}>Edit</Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1" 
                    onClick={() => deleteGig(gig.id)}
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Active Orders */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Active Orders</h2>
        {activeOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">You don't have any active orders yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{order.gigTitle}</h3>
                    <p className="text-sm text-gray-500">Buyer: {order.buyer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${order.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
