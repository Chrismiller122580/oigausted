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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg line-clamp-2">{gig.title}</CardTitle>
            <CardDescription className="text-sm">{gig.category}</CardDescription>
          </div>
          <span className="text-xl font-bold text-primary whitespace-nowrap">
            ${gig.price.toLocaleString("es-CO")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {gig.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between items-center border-t">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{gig.seller}</span>
          <span className="text-yellow-500"> {gig.rating}</span>
          <span className="text-muted-foreground">({gig.reviews})</span>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/gigs/${gig.id}`}>Ver Gig</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
