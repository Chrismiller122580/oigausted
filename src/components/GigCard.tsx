"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Gig {
  id: string
  title: string
  description: string
  price: number
  category: string
  completionTime?: string
  seller: string
}

export default function GigCard({ gig }: { gig: Gig }) {
  const router = useRouter()
  const [currentUserName, setCurrentUserName] = useState("")

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUserName(user.name || "")
      } catch (e) {}
    }
  }, [])

  const isOwnGig = currentUserName && 
    gig.seller.toLowerCase().includes(currentUserName.toLowerCase())

  const handleBuyNow = () => {
    if (isOwnGig) {
      alert("No puedes comprar tu propio gig")
      return
    }

    const orderId = "order-" + Date.now()
    const newOrder = {
      id: orderId,
      gigTitle: gig.title,
      price: gig.price,
      status: "Pending",
      progress: 0,
      buyer: currentUserName || "Comprador",
      seller: gig.seller,
      messages: [],
      files: [],
      addOns: [],
      createdAt: new Date().toISOString()
    }

    let savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    savedOrders.push(newOrder)
    localStorage.setItem("oigausted-orders", JSON.stringify(savedOrders))

    router.push(`/checkout/${orderId}`)
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-xl">{gig.title}</CardTitle>
        <p className="text-sm text-gray-500">Por {gig.seller}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold text-yellow-600">
          ${gig.price.toLocaleString()}
        </div>
        <p className="text-sm text-gray-600 line-clamp-3">{gig.description}</p>
        {gig.completionTime && (
          <p className="text-xs text-gray-500">Entrega: {gig.completionTime}</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link href={`/gigs/${gig.id}`}>Ver Detalles</Link>
        </Button>

        {isOwnGig ? (
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
            <Link href={`/create-gig?edit=${gig.id}`}>Editar Gig</Link>
          </Button>
        ) : (
          <Button 
            onClick={handleBuyNow}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            Comprar Ahora
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
