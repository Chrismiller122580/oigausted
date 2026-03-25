import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"

interface GigProps {
  id: string
  title: string
  description: string
  price: number
  category: string
  seller: string
  rating: number
  reviews: number
}

export function GigCard({ gig }: { gig: GigProps }) {
  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-yellow-500 group">
      <CardHeader className="p-6 pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-yellow-600 transition-colors">
              {gig.title}
            </CardTitle>
            <CardDescription className="text-sm mt-1 text-yellow-600 font-medium">
              {gig.category}
            </CardDescription>
          </div>
          <div className="text-right ml-4">
            <span className="text-2xl font-bold text-yellow-600">
              ${gig.price.toLocaleString("es-CO")}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{gig.description}</p>
      </CardContent>

      <CardFooter className="p-6 pt-4 border-t flex justify-between items-center">
        <div>
          <span className="font-medium text-sm">{gig.seller}</span>
          <div className="flex items-center gap-1 text-amber-500 text-sm">
            ★ {gig.rating} <span className="text-muted-foreground">({gig.reviews})</span>
          </div>
        </div>
        <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
          <Link href={`/gigs/${gig.id}`}>Ver Gig</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
