"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
    if (savedProfile) setBusinessProfile(JSON.parse(savedProfile))
  }, [currentUserName, usernameSlug])

  const deleteGig = (id: string) => {
    if (!confirm("¿Eliminar este gig?")) return
    let gigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    gigs = gigs.filter((g: any) => g.id !== id)
    localStorage.setItem("oigausted-gigs", JSON.stringify(gigs))
    setMyGigs(myGigs.filter(g => g.id !== id))
    alert("Gig eliminado")
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
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Published Gigs</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-yellow-600">{myGigs.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Estimated Earnings</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-green-600">${earnings.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Active Orders</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold">{activeOrders.length}</p></CardContent>
        </Card>
      </div>

      {/* Business Profile - already there, skipping for brevity */}

      {/* My Gigs */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">My Published Gigs</h2>
        {myGigs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">You don't have any gigs published yet.</p>
            <Button onClick={() => router.push("/create-gig")} className="mt-6">Create my first Gig</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGigs.map((gig) => (
              <Card key={gig.id}>
                <CardHeader>
                  <CardTitle>{gig.title}</CardTitle>
                  <p>${gig.price.toLocaleString()} COP</p>
                </CardHeader>
                <CardFooter className="flex gap-3">
                  <Button variant="outline" asChild><Link href={`/create-gig?edit=${gig.id}`}>Edit</Link></Button>
                  <Button variant="destructive" onClick={() => deleteGig(gig.id)}>Delete</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payouts / Earnings Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Mis Pagos y Ganancias</h2>
        <Card>
          <CardContent className="p-8">
            <p className="text-4xl font-bold text-green-600 mb-2">${earnings.toLocaleString()} COP</p>
            <p className="text-gray-500">Ganancias estimadas (basado en gigs publicados)</p>
            <div className="mt-8 text-sm text-gray-500">
              Nota: Los pagos reales se procesarán una vez que integremos Wompi Payouts. Por ahora es una estimación.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Órdenes Activas</h2>
        {activeOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No tienes órdenes activas todavía.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6 flex justify-between">
                  <div>
                    <h3>{order.gigTitle}</h3>
                    <p className="text-sm text-gray-500">Comprador: {order.buyer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${order.price.toLocaleString()}</p>
                    <p className="text-xs text-orange-600">{order.status}</p>
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
