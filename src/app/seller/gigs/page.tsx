'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Pause, Play, Edit2, Trash2, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';

interface GigWithStats {
  id: string;
  title: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  isActive: boolean;
  stats?: {
    orderCount: number;
    completedCount: number;
    completedRevenue: number;
  };
}

export default function SellerGigsManagement() {
  const { data: session } = useSession();
  const [gigs, setGigs] = useState<GigWithStats[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<GigWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  const fetchGigs = async () => {
    try {
      const res = await fetch('/api/seller/gigs');
      const data = await res.json();
      const gigList = Array.isArray(data) ? data : data?.gigs || [];
      setGigs(gigList);
    } catch (error) {
      console.error('Error loading gigs:', error);
      toast.error('No se pudieron cargar tus servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  // Client-side filtering
  useEffect(() => {
    let result = [...gigs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(term) ||
        g.category.toLowerCase().includes(term)
      );
    }

    if (statusFilter === 'active') {
      result = result.filter(g => g.isActive);
    } else if (statusFilter === 'paused') {
      result = result.filter(g => !g.isActive);
    }

    setFilteredGigs(result);
  }, [gigs, searchTerm, statusFilter]);

  const toggleActive = async (gig: GigWithStats) => {
    const newStatus = !gig.isActive;
    const previousGigs = [...gigs];

    // Optimistic update
    setGigs(prev =>
      prev.map(g => g.id === gig.id ? { ...g, isActive: newStatus } : g)
    );

    try {
      const res = await fetch(`/api/gigs/${gig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (res.ok) {
        toast.success(newStatus ? 'Servicio activado' : 'Servicio pausado (no aparece en búsquedas)');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al cambiar estado');
      }
    } catch (error: unknown) {
      setGigs(previousGigs); // revert
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado');
    }
  };

  const handleDelete = async (gigId: string, gigTitle: string) => {
    if (!window.confirm(`¿Eliminar "${gigTitle}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/gigs/${gigId}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast.success('Servicio eliminado');
        setGigs(prev => prev.filter(g => g.id !== gigId));
      } else {
        toast.error(data.error || 'No se pudo eliminar el servicio');
      }
    } catch (err) {
      toast.error('Error al eliminar el servicio');
    }
  };

  // Summary stats
  const totalGigs = gigs.length;
  const activeGigs = gigs.filter(g => g.isActive).length;
  const pausedGigs = totalGigs - activeGigs;
  const totalOrders = gigs.reduce((sum, g) => sum + (g.stats?.orderCount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando tus servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <MapsPollutionNuke />
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground">Mis Servicios</h1>
            <p className="text-xl text-muted-foreground mt-2">Gestiona, pausa o edita tus gigs</p>
          </div>
          {/* Center the CTA on mobile so it aligns nicely with the gig tiles below */}
          <div className="flex justify-center md:justify-end">
            <Link href="/create-gig">
              <Button className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6 rounded-2xl flex items-center gap-3">
                <Plus size={22} /> Crear Nuevo Servicio
              </Button>
            </Link>
          </div>
        </div>

        {/* Public profile promo in gigs management */}
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/40 border border-orange-100 dark:border-orange-900/50 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
          <div className="flex-1">
            <span className="font-medium">🔗 Tus clientes pueden contactarte directamente</span> usando tu perfil público personalizado.
          </div>
          <Link href="/seller/profile">
            <Button size="sm" variant="outline" className="border-orange-300">Ver mi enlace y QR público</Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total de Gigs</p>
              <p className="text-4xl font-bold mt-1 text-foreground">{totalGigs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-4xl font-bold mt-1 text-green-600">{activeGigs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Pausados</p>
              <p className="text-4xl font-bold mt-1 text-foreground">{pausedGigs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Pedidos Recibidos</p>
              <p className="text-4xl font-bold mt-1 text-orange-600">{totalOrders}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <Input
              placeholder="Buscar por título o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className="rounded-2xl"
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('active')}
              className="rounded-2xl"
            >
              Activos
            </Button>
            <Button
              variant={statusFilter === 'paused' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('paused')}
              className="rounded-2xl"
            >
              Pausados
            </Button>
          </div>
        </div>

        {/* Gigs Grid */}
        {filteredGigs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredGigs.map(gig => (
              <Card key={gig.id} className="overflow-hidden hover:shadow-lg transition">
                <CardContent className="p-0">
                  {/* Header with image + status */}
                  <div className="relative h-48 bg-muted">
                    {gig.imageUrl ? (
                      <img 
                        src={gig.imageUrl} 
                        alt={gig.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
                        🛠️
                      </div>
                    )}
                    
                    <button
                      onClick={() => toggleActive(gig)}
                      className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-md transition ${
                        gig.isActive 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-gray-700 text-white hover:bg-gray-800'
                      }`}
                    >
                      {gig.isActive ? <Play size={14} /> : <Pause size={14} />}
                      {gig.isActive ? 'Activo' : 'Pausado'}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-2xl font-semibold leading-tight">{gig.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{gig.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-orange-600">
                          ${gig.price.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="flex gap-6 text-sm text-muted-foreground mb-6 pt-4 border-t">
                      <div>
                        <span className="font-medium text-foreground">{gig.stats?.orderCount || 0}</span> pedidos
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{gig.stats?.completedCount || 0}</span> completados
                      </div>
                      <div className="text-green-600 font-medium">
                        ${((gig.stats?.completedRevenue || 0) / 1000).toFixed(0)}k ganados
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/create-gig?edit=${gig.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Edit2 size={16} /> Editar
                        </Button>
                      </Link>

                      <Link href={`/gigs/${gig.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye size={16} /> Ver público
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(gig)}
                        className="flex items-center gap-2"
                      >
                        {gig.isActive ? <Pause size={16} /> : <Play size={16} />}
                        {gig.isActive ? 'Pausar' : 'Activar'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(gig.id, gig.title)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-200 ml-auto"
                      >
                        <Trash2 size={16} /> Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border">
            <div className="text-6xl mb-6">📭</div>
            <h3 className="text-2xl font-semibold mb-2 text-foreground">No tienes servicios aquí</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? 'No hay gigs que coincidan con tu filtro.' 
                : 'Publica tu primer servicio y empieza a recibir pedidos.'}
            </p>
            <Link href="/create-gig">
              <Button className="bg-orange-600 hover:bg-orange-700 px-8 py-6 text-lg rounded-2xl">
                Crear mi primer gig
              </Button>
            </Link>
          </div>
        )}

        {/* Footer tip */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Los gigs pausados no aparecen en búsquedas ni en el marketplace.
        </p>
      </div>
    </div>
  );
}
