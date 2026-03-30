"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Gig {
  id: string
  title: string
  price: number
  category: string
  sellerId?: string
}

export default function SellerDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [myGigs, setMyGigs] = useState<Gig[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (!userStr) {
      router.push("/login")
      return
    }

    const user = JSON.parse(userStr)
    setCurrentUser(user)

    // Load gigs created by this user
    const savedGigsStr = localStorage.getItem("oigausted-gigs")
    if (savedGigsStr) {
      const allGigs: Gig[] = JSON.parse(savedGigsStr)
      const userGigs = allGigs.filter(g => g.sellerId === user.id)
      setMyGigs(userGigs)
    }
  }, [router])

  if (!currentUser) {
    return <div className="container py-12 text-center">Redirigiendo a login...</div>
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Panel del Vendedor</h1>
          <p className="text-gray-600 mt-1">Bienvenido, {currentUser.name}</p>
        </div>
        <Link href="/create-gig">
          <Button>+ Publicar Nuevo Gig</Button>
        </Link>
      </div>

      <div className="bg-white border rounded-3xl p-8">
        <h2 className="text-2xl font-semibold mb-6">Mis Gigs Publicados</h2>
        
        {myGigs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Aún no tienes gigs publicados.</p>
            <Link href="/create-gig" className="text-yellow-600 hover:underline mt-4 inline-block">
              Publica tu primer gig →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myGigs.map((gig) => (
              <div key={gig.id} className="border rounded-2xl p-6 hover:shadow-md">
                <h3 className="font-semibold text-lg mb-2">{gig.title}</h3>
                <p className="text-sm text-gray-500 mb-1">{gig.category}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${gig.price.toLocaleString("es-CO")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 text-center">
        <Link href="/profile" className="text-yellow-600 hover:underline">
          ← Volver a Mi Perfil
        </Link>
      </div>
    </div>
  )
}
