'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Gig {
  id: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  completionTime?: string;
  imageUrl?: string;
  seller: {
    id: string;
    name?: string;
    businessName?: string;
    rating?: number;
  };
}

export default function GigCard({ gig }: { gig: Gig }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const sellerName = gig.seller?.businessName || gig.seller?.name || "Vendedor";
  const isOwnGig = userId && userId === gig.seller.id;

  const handleBuyNow = () => {
    if (isOwnGig) {
      alert("No puedes comprar tu propio gig");
      return;
    }
    router.push(`/checkout/${gig.id}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all">
      {gig.imageUrl && (
        <img src={gig.imageUrl} alt={gig.title} className="w-full h-48 object-cover" />
      )}
      <CardHeader>
        <CardTitle className="line-clamp-2">{gig.title}</CardTitle>
        <p className="text-sm text-gray-500">{sellerName}</p>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 line-clamp-3 mb-4">{gig.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-3xl font-bold text-orange-600">
            ${Number(gig.price).toLocaleString('es-CO')}
          </span>
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
  );
}
