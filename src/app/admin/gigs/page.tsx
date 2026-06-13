'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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
      toast.error('Error loading gigs');
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
        toast.success(gig.isActive ? 'Gig paused' : 'Gig activated');
        fetchGigs();
      } else {
        toast.error('Could not change status');
      }
    } catch {
      toast.error('Error');
    }
  };

  const deleteGig = async (gig: Gig) => {
    if ((gig.orderCount || 0) > 0) {
      toast.error('Cannot delete gig with existing orders. Pause it instead.');
      return;
    }
    if (!window.confirm(`Delete "${gig.title}"? This action is permanent and the gig has no orders.`)) return;

    try {
      const res = await fetch('/api/admin/gigs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id })
      });
      if (res.ok) {
        toast.success('Gig deleted');
        fetchGigs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not delete');
      }
    } catch {
      toast.error('Error deleting');
    }
  };

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold">Gig Moderation</h1>
            <p className="text-muted-foreground mt-1">Manage all platform services</p>
          </div>
          <Input
            placeholder="Search by title, seller or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm bg-card border-border"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading gigs...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No gigs found matching the criteria.</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search.</p>
              </div>
            )}

            {filtered.map(gig => (
              <Card key={gig.id} className="bg-card border-border">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold truncate">{gig.title}</h3>
                      <span className={`px-3 py-0.5 text-xs rounded-full ${gig.isActive ? 'bg-emerald-600' : 'bg-muted'}`}>
                        {gig.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {gig.seller?.businessName || gig.seller?.name || 'Seller'} • ${gig.price?.toLocaleString('es-CO')} • {gig.category}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gig.orderCount || 0} orders • Created {new Date(gig.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap md:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(gig)}
                      className="border-border flex items-center gap-2"
                    >
                      {gig.isActive ? <Pause size={16} /> : <Play size={16} />}
                      {gig.isActive ? 'Pause' : 'Activate'}
                    </Button>

                    <a href={`/gigs/${gig.id}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="border-border flex items-center gap-2">
                        <Eye size={16} /> View
                      </Button>
                    </a>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteGig(gig)}
                      disabled={(gig.orderCount || 0) > 0}
                      title={(gig.orderCount || 0) > 0 ? 'Cannot delete: this gig has existing orders. Use pause instead.' : 'Delete gig'}
                      className="flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 size={16} /> Delete
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
