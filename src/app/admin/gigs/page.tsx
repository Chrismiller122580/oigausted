'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Pause, Play, Trash2, Eye, Edit2 } from 'lucide-react';

interface Gig {
  id: string;
  title: string;
  price: number;
  category: string | null;
  description?: string | null;
  completionTime?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
  seller: {
    name: string | null;
    email: string;
    businessName?: string | null;
  };
  orderCount?: number;
  isRemote?: boolean;
  city?: string | null;
}

export default function AdminGigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filtered, setFiltered] = useState<Gig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchGigs = async (search = '', withDeleted = includeDeleted) => {
    setLoading(true);
    try {
      let url = search ? `/api/admin/gigs?search=${encodeURIComponent(search)}` : '/api/admin/gigs';
      if (withDeleted) {
        url += (url.includes('?') ? '&' : '?') + 'includeDeleted=true';
      }
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
    fetchGigs(searchTerm, includeDeleted);
  }, [includeDeleted]);

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

  // Soft delete (sets deletedAt)
  const softDeleteGig = async (gig: Gig) => {
    if (!window.confirm(`Soft-delete "${gig.title}"? It can be restored later from the admin list.`)) return;

    try {
      const res = await fetch('/api/admin/gigs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id, deletedAt: new Date().toISOString() })
      });
      if (res.ok) {
        toast.success('Gig soft-deleted (can be restored)');
        fetchGigs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not delete');
      }
    } catch {
      toast.error('Error soft-deleting');
    }
  };

  const restoreGig = async (gig: Gig) => {
    if (!window.confirm(`Restore "${gig.title}"?`)) return;

    try {
      const res = await fetch('/api/admin/gigs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId: gig.id, deletedAt: null })
      });
      if (res.ok) {
        toast.success('Gig restored');
        fetchGigs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not restore');
      }
    } catch {
      toast.error('Error restoring');
    }
  };

  // Edit
  const openEdit = async (gig: Gig) => {
    setEditingGig(gig);
    // Fetch full details if needed (current list may be partial)
    try {
      const res = await fetch(`/api/gigs/${gig.id}`);
      const full = await res.json();
      setEditForm({
        title: full.title || gig.title,
        price: full.price || gig.price,
        description: full.description || '',
        category: full.category || gig.category || '',
        completionTime: full.completionTime || '',
        imageUrl: full.imageUrl || '',
        isRemote: full.isRemote ?? gig.isRemote ?? false,
        city: full.city || '',
      });
    } catch {
      // fallback to list data
      setEditForm({
        title: gig.title,
        price: gig.price,
        description: '',
        category: gig.category || '',
        completionTime: '',
        imageUrl: '',
        isRemote: gig.isRemote ?? false,
        city: gig.city || '',
      });
    }
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editingGig) return;
    try {
      const res = await fetch('/api/admin/gigs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: editingGig.id,
          ...editForm,
          price: parseFloat(editForm.price) || 0,
        })
      });
      if (res.ok) {
        toast.success('Gig updated');
        setIsEditOpen(false);
        setEditingGig(null);
        fetchGigs();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not save changes');
      }
    } catch {
      toast.error('Error saving');
    }
  };

  const closeEdit = () => {
    setIsEditOpen(false);
    setEditingGig(null);
    setEditForm({});
  };

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-bold">Gig Moderation</h1>
            <p className="text-muted-foreground mt-1">Manage all platform services — delete, edit, restore</p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by title, seller or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-card border-border"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="accent-primary"
              />
              Include deleted
            </label>
          </div>
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
                      {gig.deletedAt ? (
                        <span className="px-3 py-0.5 text-xs rounded-full bg-red-600 text-white">Deleted</span>
                      ) : (
                        <span className={`px-3 py-0.5 text-xs rounded-full ${gig.isActive ? 'bg-emerald-600' : 'bg-muted'}`}>
                          {gig.isActive ? 'Active' : 'Paused'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {gig.seller?.businessName || gig.seller?.name || 'Seller'} • ${gig.price?.toLocaleString('es-CO')} • {gig.category}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gig.orderCount || 0} orders • Created {new Date(gig.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap md:flex-nowrap">
                    {!gig.deletedAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(gig)}
                        className="border-border flex items-center gap-2"
                      >
                        {gig.isActive ? <Pause size={16} /> : <Play size={16} />}
                        {gig.isActive ? 'Pause' : 'Activate'}
                      </Button>
                    )}

                    <a href={`/gigs/${gig.id}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="border-border flex items-center gap-2">
                        <Eye size={16} /> View
                      </Button>
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(gig)}
                      className="border-border flex items-center gap-2"
                    >
                      <Edit2 size={16} /> Edit
                    </Button>

                    {gig.deletedAt ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => restoreGig(gig)}
                        className="flex items-center gap-2"
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => softDeleteGig(gig)}
                        className="flex items-center gap-2"
                        title="Soft delete (can be restored later)"
                      >
                        <Trash2 size={16} /> Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditOpen && editingGig && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Edit Gig: {editingGig.title}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm block mb-1">Title</label>
                <Input value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block mb-1">Price (COP)</label>
                <Input type="number" value={editForm.price || ''} onChange={e => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm block mb-1">Description</label>
                <textarea
                  className="w-full bg-background border border-border rounded p-2 min-h-[100px]"
                  value={editForm.description || ''}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Category</label>
                <Input value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
              </div>
              <div>
                <label className="text-sm block mb-1">Completion Time</label>
                <Input value={editForm.completionTime || ''} onChange={e => setEditForm({ ...editForm, completionTime: e.target.value })} placeholder="e.g. 2-3 days" />
              </div>
              <div>
                <label className="text-sm block mb-1">City / Location</label>
                <Input value={editForm.city || ''} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" checked={!!editForm.isRemote} onChange={e => setEditForm({ ...editForm, isRemote: e.target.checked })} />
                <span className="text-sm">Remote / Online service</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" onClick={closeEdit}>Cancel</Button>
              <Button onClick={saveEdit}>Save Changes</Button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Note: Full fields (addons, dynamic fields, image) can also be edited via seller dashboard or advanced admin tools.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
