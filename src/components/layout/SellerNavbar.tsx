'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Plus, Bell, DollarSign } from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useState } from 'react';
import Image from 'next/image';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsMobileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <nav className="bg-background border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo - links to homepage */}
          <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition">
            <Image 
              src="/logo.png" 
              alt="Oiga Usted" 
              width={48} 
              height={48} 
              className="w-10 h-10 sm:w-12 sm:h-12"
              priority
            />
            <span className="text-2xl font-bold text-foreground">OigaUsted</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 font-medium">
            <Link href="/seller" className="text-muted-foreground hover:text-foreground transition">Dashboard</Link>
            <Link href="/seller/gigs" className="text-muted-foreground hover:text-foreground transition">Mis Gigs</Link>
            <Link href="/seller/profile" className="font-semibold bg-orange-100 dark:bg-orange-900/40 px-4 py-1 rounded-2xl hover:bg-orange-200 dark:hover:bg-orange-900/60 transition">
              Mi Negocio
            </Link>
            <Link href="/seller/earnings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
              <DollarSign size={18} /> Ganancias
            </Link>
            <Link href="/create-gig">
              <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2">
                <Plus size={18} /> Crear Gig
              </Button>
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">
            <button className="p-2 text-muted-foreground hover:text-foreground transition relative">
              <Bell size={22} />
            </button>

            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="font-semibold text-sm leading-none text-foreground">{session?.user?.name?.split(" ")[0] || 'Vendedor'}</p>
                <p className="text-xs text-muted-foreground">Vendedor</p>
              </div>
              <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-2xl hover:ring-2 hover:ring-orange-600 transition">
                👤
              </div>
            </Link>

            <NotificationsBell />
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-red-600"
            >
              <LogOut size={20} />
            </Button>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-1">
            <ModeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-orange-600 transition"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50 pt-20 px-6 overflow-y-auto">
            <div className="flex flex-col gap-6 text-lg">
              <Link href="/seller" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/seller/gigs" onClick={() => setIsMobileMenuOpen(false)}>Mis Gigs</Link>
              <Link href="/seller/profile" onClick={() => setIsMobileMenuOpen(false)}>Mi Negocio</Link>
              <Link href="/seller/earnings" onClick={() => setIsMobileMenuOpen(false)}>Ganancias</Link>
              <Link href="/create-gig" onClick={() => setIsMobileMenuOpen(false)}>Crear Gig</Link>
              <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>Mi Perfil</Link>
              
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="mt-6 py-6 text-lg flex items-center gap-2 justify-center"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        )}
      </nav>

      <main>{children}</main>
    </>
  );
}
