'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Plus, DollarSign, Users, Tag, MessageCircle, BarChart3, Bell, Search, User } from 'lucide-react';
import { useRealtimeNotifications } from '@/lib/useRealtimeNotifications';

interface MobileBottomNavProps {
  role: 'buyer' | 'seller' | 'admin';
}

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // Get unread count so the "Notif" tab can show a visual indicator (like the header bell)
  // Hook is safe to call unconditionally — it no-ops for unauthed users and uses a global singleton for SSE.
  const { unreadCount } = useRealtimeNotifications({
    enableToasts: false,
    enableSound: false,
    enableDesktop: false,
  });

  const showNotifBadge = unreadCount > 0;

  if (role === 'seller') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-1 text-xs">
          <Link 
            href="/seller" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller') && !isActive('/seller/gigs') && !isActive('/seller/profile') && !isActive('/seller/earnings') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Home size={22} />
            <span className="mt-0.5 text-center">Inicio</span>
          </Link>
          <Link 
            href="/seller/gigs" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller/gigs') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Package size={22} />
            <span className="mt-0.5 text-center">Gigs</span>
          </Link>
          <Link 
            href="/create-gig" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/create-gig') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <div className="w-11 h-11 -mt-3 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <Plus size={24} />
            </div>
            <span className="mt-0.5 -mb-1 text-center">Crear</span>
          </Link>
          <Link 
            href="/seller/earnings" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/seller/earnings') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <DollarSign size={22} />
            <span className="mt-0.5 text-center">Ganancias</span>
          </Link>
          <Link 
            href="/referrals" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/referrals') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Users size={22} />
            <span className="mt-0.5 text-center">Referidos</span>
          </Link>
        </div>
      </nav>
    );
  }

  if (role === 'admin') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-1 text-xs">
          <Link 
            href="/admin" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/admin') && !isActive('/admin/users') && !isActive('/admin/gigs') && !isActive('/admin/notifications') && !isActive('/admin/support') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Home size={22} />
            <span className="mt-0.5 text-center">Overview</span>
          </Link>
          <Link 
            href="/admin/gigs" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/admin/gigs') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Package size={22} />
            <span className="mt-0.5 text-center">Gigs</span>
          </Link>
          <Link 
            href="/admin/users" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/admin/users') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <Users size={22} />
            <span className="mt-0.5 text-center">Usuarios</span>
          </Link>
          <Link 
            href="/admin/notifications" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/admin/notifications') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <div className="relative">
              <Bell size={22} />
              {showNotifBadge && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-600 border border-background" />
              )}
            </div>
            <span className="mt-0.5 text-center">Notif</span>
          </Link>
          <Link 
            href="/admin/support" 
            className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/admin/support') ? 'text-orange-600' : 'text-muted-foreground'}`}
          >
            <MessageCircle size={22} />
            <span className="mt-0.5 text-center">Soporte</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Buyer bottom nav
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-1 text-xs">
        <Link 
          href="/buyer" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/buyer') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Home size={22} />
          <span className="mt-0.5 text-center">Inicio</span>
        </Link>
        <Link 
          href="/gigs" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/gigs') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Search size={22} />
          <span className="mt-0.5 text-center">Explorar</span>
        </Link>
        <Link 
          href="/orders" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/orders') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <Package size={22} />
          <span className="mt-0.5 text-center">Pedidos</span>
        </Link>
        <Link 
          href="/notifications" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/notifications') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <div className="relative">
            <Bell size={22} />
            {showNotifBadge && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-600 border border-background" />
            )}
          </div>
          <span className="mt-0.5 text-center">Notif</span>
        </Link>
        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-center flex-1 py-1 ${isActive('/profile') ? 'text-orange-600' : 'text-muted-foreground'}`}
        >
          <User size={22} />
          <span className="mt-0.5 text-center">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
