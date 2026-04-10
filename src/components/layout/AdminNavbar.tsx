'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Package, TrendingUp, Home } from 'lucide-react';

export default function AdminNavbar({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <>
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
              ⚡
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">OigaUsted <span className="text-red-500">Admin</span></span>
          </Link>
          <div className="flex items-center gap-8 text-sm">
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
            <div className="flex items-center gap-4 pl-8 border-l border-zinc-800">
              <div className="text-right text-sm">
                <p className="font-semibold text-white">{session?.user?.name || 'Admin'}</p>
                <p className="text-xs text-zinc-500">Administrador</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-zinc-400 hover:text-red-500 hover:bg-zinc-800"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="bg-zinc-950 min-h-screen text-white">
        {children}
      </main>
    </>
  );
}
