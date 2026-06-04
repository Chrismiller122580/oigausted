'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { X, LogOut, User, Home, Package, Plus, DollarSign, Users, BarChart3, TrendingUp, MessageCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  role?: 'buyer' | 'seller' | 'admin' | 'public';
}

export default function MobileMenu({ isOpen, onClose, role = 'public' }: MobileMenuProps) {
  const { data: session } = useSession();

  if (!isOpen) return null;

  const handleSignOut = () => {
    onClose();
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="md:hidden fixed inset-0 z-[100] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-20 border-b border-border">
        <Link href="/" onClick={onClose} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">OU</div>
          <span className="font-bold text-xl">Oiga Usted</span>
        </Link>
        <button onClick={onClose} className="p-2">
          <X size={28} />
        </button>
      </div>

      {/* Menu Content */}
      <div className="px-6 py-8 space-y-2 text-lg overflow-y-auto h-[calc(100vh-5rem)]">
        {role === 'public' && (
          <>
            <Link href="/gigs" onClick={onClose} className="block py-4 border-b border-border">
              Explorar Gigs
            </Link>
            <Link href="/login" onClick={onClose} className="block py-4 border-b border-border">
              Iniciar Sesión
            </Link>
            <Link href="/signup" onClick={onClose} className="block py-4">
              <Button className="w-full bg-orange-600">Registrarse</Button>
            </Link>
          </>
        )}

        {role === 'buyer' && (
          <>
            <Link href="/gigs" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <Home size={22} /> Explorar Gigs
            </Link>
            <Link href="/buyer" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <Home size={22} /> Dashboard
            </Link>
            <Link href="/orders" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <Package size={22} /> Mis Pedidos
            </Link>
            <Link href="/profile" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <User size={22} /> Mi Perfil
            </Link>
            <div className="pt-4">
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center py-6 text-lg text-red-600 border-red-200"
              >
                <LogOut size={20} /> Cerrar Sesión
              </Button>
            </div>
          </>
        )}

        {role === 'seller' && (
          <>
            <Link href="/seller" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              Dashboard
            </Link>
            <Link href="/seller/gigs" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              Mis Gigs
            </Link>
            <Link href="/seller/profile" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              Mi Negocio
            </Link>
            <Link href="/seller/earnings" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <DollarSign size={22} /> Ganancias
            </Link>
            <Link href="/referrals" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              Referidos
            </Link>
            <Link href="/create-gig" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <Plus size={22} /> Crear Gig
            </Link>
            <Link href="/profile" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              Mi Perfil
            </Link>

            <div className="pt-6">
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center py-6 text-lg text-red-600 border-red-200"
              >
                <LogOut size={20} /> Cerrar Sesión
              </Button>
            </div>
          </>
        )}

        {role === 'admin' && (
          <>
            <Link href="/admin" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              Overview
            </Link>
            <Link href="/admin/users" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <Users size={22} /> Usuarios
            </Link>
            <Link href="/admin/gigs" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              Gigs
            </Link>
            <Link href="/admin/earnings" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <TrendingUp size={22} /> Ganancias
            </Link>
            <Link href="/admin/payouts" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <DollarSign size={22} /> Pagos
            </Link>
            <Link href="/admin/reports" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              Reportes
            </Link>
            <Link href="/admin/referrals" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <Users size={22} /> Referidos
            </Link>
            <Link href="/admin/notifications" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <MessageCircle size={22} /> Notificaciones
            </Link>
            <Link href="/admin/support" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <MessageCircle size={22} /> Soporte
            </Link>
            <Link href="/admin/settings" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <Settings size={22} /> Ajustes
            </Link>
            <Link href="/admin/audit" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border">
              <BarChart3 size={22} /> Auditoría
            </Link>
            <Link href="/admin/grok-build" onClick={onClose} className="flex items-center gap-3 py-4 border-b border-border font-medium">
              ✨ Grok Build
            </Link>

            <div className="pt-6">
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center py-6 text-lg text-red-600 border-red-200"
              >
                <LogOut size={20} /> Cerrar Sesión
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
