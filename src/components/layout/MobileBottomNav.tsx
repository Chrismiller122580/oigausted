'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Plus, DollarSign, Users } from 'lucide-react';

interface MobileBottomNavProps {
  role: 'buyer' | 'seller';
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  if (role === 'seller') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2 text-xs">
          <Link 
            href="/seller" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller') && !isActive('/seller/gigs') && !isActive('/seller/profile') && !isActive('/seller/earnings') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Home size={22} />
            <span className="mt-0.5">Inicio</span>
          </Link>
          <Link 
            href="/seller/gigs" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller/gigs') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Package size={22} />
            <span className="mt-0.5">Mis Gigs</span>
          </Link>
          <Link 
            href="/create-gig" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/create-gig') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <div className="w-11 h-11 -mt-3 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <Plus size={24} />
            </div>
            <span className="mt-0.5 -mb-1">Crear</span>
          </Link>
          <Link 
            href="/seller/earnings" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller/earnings') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <DollarSign size={22} />
            <span className="mt-0.5">Ganancias</span>
          </Link>
          <Link 
            href="/referrals" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/referrals') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Users size={22} />
            <span className="mt-0.5">Referidos</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Buyer bottom nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2 text-xs">
        <Link 
          href="/buyer" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/buyer') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Home size={22} />
          <span className="mt-0.5">Inicio</span>
        </Link>
        <Link 
          href="/gigs" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/gigs') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Package size={22} />
          <span className="mt-0.5">Explorar</span>
        </Link>
        <Link 
          href="/orders" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/orders') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Package size={22} />
          <span className="mt-0.5">Pedidos</span>
        </Link>
        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/profile') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Home size={22} />
          <span className="mt-0.5">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
