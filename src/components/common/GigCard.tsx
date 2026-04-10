"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

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
  const { data: session } = useSession()
  const router = useRouter()

  const sellerName = gig.seller?.name || gig.seller?.businessName || gig.seller?.email || "Vendedor"
  const isOwnGig = session?.user && gig.seller.id === (session.user as any).id

  const handleBuyNow = () => {
    if (isOwnGig) {
      alert("No puedes comprar tu propio gig")
      return
    }
    router.push(`/checkout/${gig.id}`)
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {gig.imageUrl && (
        <div className="relative h-52 overflow-hidden">
          <img 
            src={gig.imageUrl} 
            alt={gig.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        </div>
      )}

      <CardHeader>
        <CardTitle className="line-clamp-2 text-xl">{gig.title}</CardTitle>
        <p className="text-sm text-gray-500">por {sellerName}</p>
      </CardHeader>

      <CardContent className="pb-4">
        {gig.description && (
          <p className="text-gray-600 line-clamp-3 text-sm mb-4">{gig.description}</p>
        )}
        
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-orange-600">
            ${gig.price.toLocaleString("es-CO")}
          </span>
          <span className="text-sm text-gray-500">COP</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button 
          onClick={handleBuyNow}
          className="w-full bg-orange-600 hover:bg-orange-700"
          disabled={isOwnGig}
        >
          {isOwnGig ? "Tu propio gig" : "Comprar ahora"}
        </Button>
      </CardFooter>
    </Card>
  )
}
