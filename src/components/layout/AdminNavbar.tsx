'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Users, Package, TrendingUp, Home, Settings, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function AdminNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: '/' });
  };

  return (
    <>
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              ⚡
            </div>
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-white">
              OigaUsted <span className="text-red-500">Admin</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/admin" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
              <Home size={18} /> Overview
            </Link>
            <Link href="/admin/users" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
              <Users size={18} /> Usuarios
            </Link>
            <Link href="/admin/gigs" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
              <Package size={18} /> Gigs
            </Link>
            <Link href="/admin/earnings" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
              <TrendingUp size={18} /> Ganancias
            </Link>
            <Link href="/admin/reports" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
              <BarChart3 size={18} /> Reportes
            </Link>
            <Link href="/admin/settings" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
              <Settings size={18} /> Configuración
            </Link>

            <div className="flex items-center gap-4 pl-8 border-l border-zinc-800">
              <div className="text-right text-sm">
                <p className="font-semibold text-white">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-zinc-500">Administrador</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-red-500 hover:bg-zinc-800"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>

          {/* Hamburger Button - Visible only on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu - Full screen overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-zinc-900 z-[60] pt-20 px-6 overflow-y-auto">
            <div className="flex flex-col gap-6 text-lg">
              <Link 
                href="/admin" 
                className="flex items-center gap-3 py-4 border-b border-zinc-800 text-white hover:text-red-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={22} /> Overview
              </Link>
              <Link 
                href="/admin/users" 
                className="flex items-center gap-3 py-4 border-b border-zinc-800 text-white hover:text-red-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users size={22} /> Usuarios
              </Link>
              <Link 
                href="/admin/gigs" 
                className="flex items-center gap-3 py-4 border-b border-zinc-800 text-white hover:text-red-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Package size={22} /> Gigs
              </Link>
              <Link 
                href="/admin/earnings" 
                className="flex items-center gap-3 py-4 border-b border-zinc-800 text-white hover:text-red-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUp size={22} /> Ganancias
              </Link>
              <Link 
                href="/admin/reports" 
                className="flex items-center gap-3 py-4 border-b border-zinc-800 text-white hover:text-red-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart3 size={22} /> Reportes
              </Link>
              <Link 
                href="/admin/settings" 
                className="flex items-center gap-3 py-4 border-b border-zinc-800 text-white hover:text-red-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings size={22} /> Configuración
              </Link>

              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="mt-8 py-6 text-lg flex items-center gap-3 justify-center border border-zinc-700 hover:bg-zinc-800"
              >
                <LogOut size={22} />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        )}
      </nav>

      <main className="bg-zinc-950 min-h-screen text-white">
        {children}
      </main>
    </>
  );
}
