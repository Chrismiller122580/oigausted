"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Gig {
  id: string
  title: string
  description?: string
  price: number
  category?: string
  completionTime?: string
  imageUrl?: string
  seller: {
    id: string
    name?: string
    email: string
    businessName?: string
  }
}

export default function GigCard({ gig }: { gig: Gig }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr))
      } catch (e) {}
    }
  }, [])

  const sellerName = gig.seller?.name || gig.seller?.businessName || gig.seller?.email || "Vendedor"
  const isOwnGig = currentUser && gig.seller.id === currentUser.id

  const handleBuyNow = () => {
    if (isOwnGig) {
      alert("No puedes comprar tu propio gig")
      return
    }
    router.push(`/checkout/${gig.id}`)
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {gig.imageUrl && (
        <img 
          src={gig.imageUrl} 
          alt={gig.title} 
          className="w-full h-48 object-cover" 
        />
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{gig.title}</CardTitle>
        <p className="text-sm text-gray-500">{sellerName}</p>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 line-clamp-3 mb-4">{gig.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-3xl font-bold text-orange-600">
            ${gig.price.toLocaleString("es-CO")}
          </span>
          {gig.category && (
            <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
              {gig.category}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBuyNow}
          className="w-full bg-orange-600 hover:bg-orange-700"
          disabled={isOwnGig}
        >
          {isOwnGig ? "Tu propio gig" : "Comprar Ahora"}
        </Button>
      </CardFooter>
    </Card>
  )
}
