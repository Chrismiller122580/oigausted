'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';

export default function SellerNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          
          {/* Left: Logo + OigaUsted */}
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Oiga Usted" 
              width={48} 
              height={48} 
              className="w-10 h-10 sm:w-12 sm:h-12"
              priority
            />
            <span className="text-2xl font-bold text-orange-600">OigaUsted</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/seller" className="font-medium text-gray-700 hover:text-orange-600 transition">Dashboard</Link>
            <Link href="/gigs" className="font-medium text-gray-700 hover:text-orange-600 transition">Mis Gigs</Link>
            <Link href="/seller/profile" className="font-medium text-gray-700 hover:text-orange-600 transition">Mi Negocio</Link>
            
            <Link href="/create-gig">
              <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2 px-6">
                <Plus size={18} /> Crear Gig
              </Button>
            </Link>

            <Link href="/orders" className="font-medium text-gray-700 hover:text-orange-600 transition">Mis Pedidos</Link>
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-6">
            {/* Notification Bell */}
            <button className="p-2 text-gray-600 hover:text-orange-600 transition relative">
              <Bell size={22} />
            </button>

            {/* Clickable User Avatar → Profile */}
            <Link href="/seller/profile" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-xl overflow-hidden">
                👤
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm leading-none">{session?.user?.name || 'Vendedor'}</p>
                <p className="text-xs text-gray-500">Vendedor</p>
              </div>
            </Link>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut size={20} />
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-orange-600 transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50 pt-20 px-6 overflow-y-auto">
            <div className="flex flex-col gap-6 text-lg">
              <Link href="/" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Inicio</Link>
              <Link href="/seller" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/gigs" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Mis Gigs</Link>
              <Link href="/seller/profile" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Mi Negocio</Link>
              <Link href="/orders" className="py-4 border-b" onClick={() => setIsMobileMenuOpen(false)}>Mis Pedidos</Link>
              
              <Link href="/create-gig" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full py-6 bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2 text-lg">
                  <Plus size={20} /> Crear Gig
                </Button>
              </Link>

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
