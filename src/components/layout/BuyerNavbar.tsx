'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, ShoppingBag, User } from 'lucide-react';

export default function BuyerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/buyer" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl">
              🛍️
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">OigaUsted</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600 transition">Explorar Gigs</Link>
            <Link href="/buyer" className="font-medium text-gray-700 hover:text-orange-600 transition flex items-center gap-1">
              <ShoppingBag size={18} /> Mis Pedidos
            </Link>
            <div className="flex items-center gap-4 pl-6 border-l">
              <div className="text-right">
                <p className="font-semibold text-sm">{session?.user?.name || 'Comprador'}</p>
                <p className="text-xs text-emerald-600">Buyer</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-500 hover:text-red-600"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>
    </>
  );
}
