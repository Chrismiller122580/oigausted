'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Store, Package, User, LogOut } from 'lucide-react';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left side - Logo + Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                O
              </div>
              <div>
                <span className="text-2xl font-bold text-orange-600">Oiga</span>
                <span className="text-2xl font-bold text-gray-900">Usted</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/seller" className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-600">
                <Store size={18} />
                Dashboard
              </Link>
              <Link href="/seller/profile" className="flex items-center gap-1.5 hover:text-emerald-600">
                <User size={18} />
                Mi Negocio
              </Link>
              <Link href="/orders" className="flex items-center gap-1.5 hover:text-emerald-600">
                <Package size={18} />
                Pedidos
              </Link>
            </div>
          </div>

          {/* Right side - Actions + Profile */}
          <div className="flex items-center gap-4">
            {/* Create Gig Button */}
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/create-gig" className="flex items-center gap-2">
                <PlusCircle size={18} />
                Crear Gig
              </Link>
            </Button>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3 pl-4 border-l">
              <Link 
                href="/seller/profile"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  👤
                </div>
                <span className="hidden md:inline">{session?.user?.name || "Perfil"}</span>
              </Link>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-600 hover:text-red-600 p-2"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  );
}