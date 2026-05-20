'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Pause, Play, Trash2, Eye } from 'lucide-react';

interface Gig {
  id: string;
  title: string;
  price: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  seller: {
    name: string | null;
    email: string;
    businessName?: string | null;
  };
  orderCount?: number;
}

export default function AdminGigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filtered, setFiltered] = useState<Gig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGigs = async (search = '') => {
    setLoading(true);
    try {
      const url = search ? `/api/admin/gigs?search=${encodeURIComponent(search)}` : '/api/admin/gigs';
      const res = await fetch(url);
      const data = await res.json();
      const list = data.gigs || [];
      setGigs(list);
      setFiltered(list);
    } catch (e) {
      toast.error('Error cargando gigs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const result = gigs.filter(g =>
      g.title.toLowerCase().includes(term) ||
      g.seller?.name?.toLowerCase().includes(term) ||
      g.seller?.email?.toLowerCase().includes(term) ||
      g.seller?.businessName?.toLowerCase().includes(term)
    );
    setFiltered(result);
  }, [searchTerm, gigs]);

  const toggleActive = async (gig: Gig) => {
    try {
      const res = await fetch('/api/admin/gigs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id, isActive: !gig.isActive })
      });
      if (res.ok) {
        toast.success(gig.isActive ? 'Gig pausado' : 'Gig activado');
        fetchGigs();
      } else {
        toast.error('No se pudo cambiar el estado');
      }
    } catch {
      toast.error('Error');
    }
  };

  const deleteGig = async (gig: Gig) => {
    if (!window.confirm(`¿Eliminar "${gig.title}"? Esta acción es permanente.`)) return;

    try {
      const res = await fetch('/api/admin/gigs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id })
      });
      if (res.ok) {
        toast.success('Gig eliminado');
        fetchGigs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'No se pudo eliminar');
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold">Moderación de Gigs</h1>
            <p className="text-zinc-400 mt-1">Administra todos los servicios de la plataforma</p>
          </div>
          <Input
            placeholder="Buscar por título, vendedor o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm bg-zinc-900 border-zinc-700"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-zinc-400">Cargando gigs...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-zinc-400">No se encontraron gigs con ese criterio.</p>
                <p className="text-sm text-zinc-500 mt-1">Prueba con otra búsqueda.</p>
              </div>
            )}

            {filtered.map(gig => (
              <Card key={gig.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold truncate">{gig.title}</h3>
                      <span className={`px-3 py-0.5 text-xs rounded-full ${gig.isActive ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                        {gig.isActive ? 'Activo' : 'Pausado'}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      {gig.seller?.businessName || gig.seller?.name || 'Vendedor'} • ${gig.price?.toLocaleString('es-CO')} • {gig.category}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {gig.orderCount || 0} pedidos • Creado {new Date(gig.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap md:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(gig)}
                      className="border-zinc-700 flex items-center gap-2"
                    >
                      {gig.isActive ? <Pause size={16} /> : <Play size={16} />}
                      {gig.isActive ? 'Pausar' : 'Activar'}
                    </Button>

                    <a href={`/gigs/${gig.id}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="border-zinc-700 flex items-center gap-2">
                        <Eye size={16} /> Ver
                      </Button>
                    </a>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteGig(gig)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
