'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    WompiCheckout?: any;
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!gigId) return;
    loadGigAndCreateOrder();
  }, [gigId]);

  const loadGigAndCreateOrder = async () => {
    try {
      // Load gig details
      const gigRes = await fetch(`/api/gigs/${gigId}`);
      const gigData = await gigRes.json();
      setGig(gigData);

      // Create order first (Pending)
      const orderRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);
      
      setOrder(orderData.order);
    } catch (err: any) {
      toast.error(err.message || "Failed to load checkout");
    } finally {
      setLoading(false);
    }
  };

  const openWompiWidget = async () => {
    if (!order || !gig) return;
    setOpening(true);

    try {
      const res = await fetch('/api/checkout/wompi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      const { checkoutUrl, error } = await res.json();
      if (error) throw new Error(error);

      // Open Wompi Widget
      if (window.WompiCheckout) {
        const checkout = new window.WompiCheckout({
          publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
          currency: 'COP',
          amountInCents: order.price * 100,   // Important: cents
          reference: order.id,
          redirectUrl: `${window.location.origin}/orders/${order.id}`,
          // Optional: customer data
          customerData: {
            email: session?.user?.email || '',
            fullName: session?.user?.name || '',
          }
        });
        checkout.open();
      } else {
        // Fallback: redirect to checkout URL
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err.message || "Could not open Wompi");
    } finally {
      setOpening(false);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading checkout...</div>;
  if (!gig || !order) return <div className="p-20 text-center text-red-600">Error loading order</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <Card>
        <CardHeader>
          <CardTitle>{gig.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between text-xl">
            <span>Total to pay:</span>
            <span className="font-bold">${order.price.toLocaleString('es-CO')}</span>
          </div>

          <Button 
            onClick={openWompiWidget} 
            disabled={opening}
            className="w-full py-8 text-lg bg-green-600 hover:bg-green-700"
          >
            {opening ? "Opening Wompi..." : "Pay with Wompi"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            You will be redirected back after payment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
