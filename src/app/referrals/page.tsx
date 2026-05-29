'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Copy, Users, DollarSign, TrendingUp, Share2 } from 'lucide-react';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    totalReferred: number;
    activeSellers: number;
    totalEarned: number;
    pendingEarnings: number;
    referralRate: number;
  };
  referredUsers: Array<{
    id: string;
    name: string;
    businessName: string | null;
    joined: string;
    status: string;
    earnings: number;
  }>;
}

export default function ReferralsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchReferralData();
    }
  }, [session]);

  const fetchReferralData = async () => {
    try {
      const res = await fetch('/api/referrals');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Error cargando datos de referidos');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center pt-20">
        <p>Cargando tus referidos...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center pt-20">
        <p>No se pudieron cargar los datos de referidos.</p>
      </div>
    );
  }

  const { referralCode, referralLink, stats, referredUsers } = data;

  const handleCopyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('No se pudo copiar el link');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Únete a OigaUsted! Soy vendedor y te recomiendo la plataforma. Gana dinero con tus servicios:\n\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Programa de Referidos</h1>
        <p className="text-muted-foreground mt-2">
          Invita a otros vendedores y gana {(stats.referralRate * 100).toFixed(0)}% de comisión sobre sus ventas.
        </p>
      </div>

      {/* Referral Link Card */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Tu enlace de invitación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 bg-muted rounded-xl text-sm font-mono border"
            />
            <Button onClick={handleCopyLink} className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleShareWhatsApp} className="flex items-center gap-2">
              Compartir por WhatsApp
            </Button>
            <Button variant="outline" onClick={() => toast('Función de compartir por email próximamente')}>
              Compartir por Email
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Cuando alguien se registre con tu enlace y se convierta en vendedor, ganarás comisión sobre sus ventas de por vida.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Personas invitadas</p>
                <p className="text-3xl font-bold mt-1">{stats.totalReferred}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendedores activos</p>
                <p className="text-3xl font-bold mt-1">{stats.activeSellers}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ganado hasta ahora</p>
                <p className="text-3xl font-bold mt-1 text-green-600">
                  ${stats.totalEarned.toLocaleString('es-CO')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendiente de pago</p>
                <p className="text-3xl font-bold mt-1 text-orange-600">
                  ${stats.pendingEarnings.toLocaleString('es-CO')}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referred Users */}
      <Card>
        <CardHeader>
          <CardTitle>Personas que has invitado</CardTitle>
        </CardHeader>
        <CardContent>
          {referredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-4">Negocio</th>
                    <th className="py-3 px-4">Se unió</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Comisión generada</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-none hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.business || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(user.joined).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'Active Seller' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${user.earnings.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Aún no has invitado a nadie. ¡Comparte tu enlace!
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <p className="font-medium">Comparte tu enlace</p>
                <p className="text-muted-foreground mt-1">Envía tu link personalizado a personas que puedan vender servicios.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <p className="font-medium">Se registran como vendedores</p>
                <p className="text-muted-foreground mt-1">Cuando se registren con tu enlace y publiquen gigs, quedarán asociados a ti.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <p className="font-medium">Ganas comisión de por vida</p>
                <p className="text-muted-foreground mt-1">Cada vez que realicen una venta, recibes una comisión (actualmente configurada en 5%).</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t text-xs text-muted-foreground">
            Las comisiones se calculan automáticamente y se pagan junto con tus ganancias como vendedor. 
            El porcentaje actual lo define el equipo de OigaUsted.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
