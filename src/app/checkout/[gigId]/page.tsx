// src/app/checkout/[gigId]/page.tsx - Fixed for Next.js 16 + auth protection
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CheckoutForm from './CheckoutForm';

export default async function CheckoutPage({ params }: { params: Promise<{ gigId: string }> }) {
  const { gigId } = await params;   // ← This fixes the Promise error

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/checkout/${gigId}`);
  }

  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    include: { 
      seller: { 
        select: { name: true, businessName: true } 
      } 
    }
  });

  if (!gig) {
    redirect('/gigs');
  }

  // Prevent self-purchase
  if (gig.sellerId === session.user.id) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-red-600 mb-4">No puedes comprar tu propio gig</h2>
        <p className="text-zinc-600">Este gig fue creado por ti.</p>
      </div>
    );
  }

  return <CheckoutForm gig={gig} buyerId={session.user.id} />;
}
