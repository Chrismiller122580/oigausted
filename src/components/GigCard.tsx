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
  seller: string
  boosted?: boolean
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

  const sellerLower = gig.seller.toLowerCase().trim()
  const userLower = currentUserName.toLowerCase().trim()

  const isOwnGig = 
    sellerLower === userLower ||
    sellerLower.includes(userLower) ||
    userLower.includes(sellerLower) ||
    (sellerLower.includes("demo") && userLower.includes("seller"))

  const handleBuyNow = () => {
    const orderId = "order-" + Date.now()
    const newOrder = {
      id: orderId,
      gigTitle: gig.title,
      price: gig.price,
      status: "Pending",
      progress: 0,
      buyer: "Current Buyer",
      seller: gig.seller,
      messages: [],
      files: []
    }
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    savedOrders.push(newOrder)
    localStorage.setItem("oigausted-orders", JSON.stringify(savedOrders))
    router.push(`/orders/${orderId}`)
  }

  const handleEditGig = () => router.push(`/create-gig?edit=${gig.id}`)

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${gig.boosted ? 'ring-2 ring-yellow-500' : ''}`}>
      {gig.boosted && <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium">⭐ Destacado</div>}
      <CardHeader>
        <CardTitle className="line-clamp-2">{gig.title}</CardTitle>
        <p className="text-sm text-gray-500">By {gig.seller}</p>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-yellow-600 mb-4">${gig.price.toLocaleString()}</p>
        <p className="text-sm text-gray-600 line-clamp-3">{gig.description}</p>
      </CardContent>
      <CardFooter className="flex gap-3 pt-6">
        <Button variant="outline" className="flex-1" asChild>
          <Link href={`/gigs/${gig.id}`}>View Details</Link>
        </Button>
        {isOwnGig ? (
          <Button onClick={handleEditGig} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">Edit Gig</Button>
        ) : (
          <Button onClick={handleBuyNow} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium">Buy Now</Button>
        )}
      </CardFooter>
    </Card>
  )
}
