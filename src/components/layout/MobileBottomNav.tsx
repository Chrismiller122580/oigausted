'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Plus, List, MessageCircle, Users, User } from 'lucide-react';

interface MobileBottomNavProps {
  role: 'buyer' | 'seller' | 'admin';
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  if (role === 'seller') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-1 text-[11px]">
          <Link 
            href="/seller" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller') && !isActive('/seller/gigs') && !isActive('/seller/orders') && !isActive('/seller/profile') && !isActive('/seller/earnings') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Home size={22} />
            <span className="mt-0.5">Inicio</span>
          </Link>
          <Link 
            href="/seller/orders" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller/orders') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <List size={22} />
            <span className="mt-0.5">Pedidos</span>
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
            href="/messages" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/messages') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <MessageCircle size={22} />
            <span className="mt-0.5">Mensajes</span>
          </Link>
          <Link 
            href="/seller/gigs" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller/gigs') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Package size={22} />
            <span className="mt-0.5">Gigs</span>
          </Link>
        </div>
      </nav>
    );
  }

  if (role === 'admin') {
    const isAdminHome =
      pathname === '/admin' || pathname === '/admin/overview';

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-1 text-[11px]">
          <Link 
            href="/admin" 
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[3rem] ${isAdminHome ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Home size={22} />
            <span className="mt-0.5">Inicio</span>
          </Link>
          <Link 
            href="/admin/orders" 
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[3rem] ${isActive('/admin/orders') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <List size={22} />
            <span className="mt-0.5">Pedidos</span>
          </Link>
          <Link 
            href="/admin/users" 
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[3rem] ${isActive('/admin/users') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Users size={22} />
            <span className="mt-0.5">Usuarios</span>
          </Link>
          <Link 
            href="/admin/gigs" 
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[3rem] ${isActive('/admin/gigs') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Package size={22} />
            <span className="mt-0.5">Gigs</span>
          </Link>
          <Link 
            href="/admin/support" 
            className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[3rem] ${isActive('/admin/support') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <MessageCircle size={22} />
            <span className="mt-0.5">Soporte</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Buyer bottom nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-1 text-[11px]">
        <Link 
          href="/buyer" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/buyer') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Home size={22} />
          <span className="mt-0.5">Inicio</span>
        </Link>
        <Link
          id="tutorial-explore-gigs"
          href="/gigs"
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/gigs') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Package size={22} />
          <span className="mt-0.5">Explorar</span>
        </Link>
        <Link 
          href="/messages" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/messages') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <MessageCircle size={22} />
          <span className="mt-0.5">Mensajes</span>
        </Link>
        <Link 
          href="/orders" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/orders') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <List size={22} />
          <span className="mt-0.5">Pedidos</span>
        </Link>
        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/profile') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <User size={22} />
          <span className="mt-0.5">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
