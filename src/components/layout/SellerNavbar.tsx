'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, PlusCircle, BarChart3, User, DollarSign } from 'lucide-react';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/seller" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl">
              💼
            </div>
            <span className="font-bold text-2xl tracking-tight text-gray-900">OigaUsted</span>
          </Link>

          <div className="flex items-center gap-10 text-sm">
            <Link href="/seller" className="font-medium text-gray-700 hover:text-orange-600 transition flex items-center gap-1.5">
              <BarChart3 size={18} /> Dashboard
            </Link>
            <Link href="/create-gig" className="font-medium text-gray-700 hover:text-orange-600 transition flex items-center gap-1.5">
              <PlusCircle size={18} /> Nuevo Gig
            </Link>
            <Link href="/seller/profile" className="font-medium text-gray-700 hover:text-orange-600 transition flex items-center gap-1.5">
              <User size={18} /> Mi Negocio
            </Link>
            <Link href="/seller/earnings" className="font-medium text-gray-700 hover:text-orange-600 transition flex items-center gap-1.5">
              <DollarSign size={18} /> Ganancias
            </Link>
          </div>

          {/* Top Right - Personal Profile Link */}
          <div className="flex items-center gap-4 pl-6 border-l">
            <Link href="/profile" className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-2xl transition group">
              <div className="text-right">
                <p className="font-semibold text-sm group-hover:text-orange-600">{session?.user?.name || 'Vendedor'}</p>
                <p className="text-xs text-amber-600">Vendedor</p>
              </div>
              <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-2xl shadow-sm">
                👤
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-500 hover:text-red-600 hover:bg-gray-100"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>
    </>
  );
}
