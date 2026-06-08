'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Save, X, Shirt, RefreshCw, Search, ExternalLink } from 'lucide-react';

interface WardrobeItem {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  shopifyId?: string | null;
  brand?: string | null;
  color?: string | null;
  size?: string | null;
  tags?: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminWardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    shopifyId: '',
    brand: '',
    color: '',
    size: '',
    tags: '',
    isActive: true,
  });

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];

  async function loadItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/admin/wardrobe?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
      } else {
        toast.error(data.error || 'Error cargando el catálogo');
      }
    } catch (e) {
      toast.error('Error de red al cargar el catálogo de wardrobe');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [search, categoryFilter]);

  function resetForm() {
    setForm({
      title: '',
      description: '',
      price: '',
      category: '',
      imageUrl: '',
      shopifyId: '',
      brand: '',
      color: '',
      size: '',
      tags: '',
      isActive: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  }

  function startEdit(item: WardrobeItem) {
    setForm({
      title: item.title || '',
      description: item.description || '',
      price: item.price != null ? String(item.price) : '',
      category: item.category || '',
      imageUrl: item.imageUrl || '',
      shopifyId: item.shopifyId || '',
      brand: item.brand || '',
      color: item.color || '',
      size: item.size || '',
      tags: item.tags || '',
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    const payload: any = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
      category: form.category.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      shopifyId: form.shopifyId.trim() || null,
      brand: form.brand.trim() || null,
      color: form.color.trim() || null,
      size: form.size.trim() || null,
      tags: form.tags.trim() || null,
      isActive: form.isActive,
    };

    try {
      const url = editingId 
        ? `/api/admin/wardrobe/${editingId}` 
        : '/api/admin/wardrobe';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? 'Item actualizado' : 'Item agregado al catálogo');
        resetForm();
        loadItems();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Error al guardar');
      }
    } catch (e) {
      toast.error('Error de red');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar "${title}" del catálogo? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/admin/wardrobe/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Item eliminado');
        loadItems();
      } else {
        toast.error('No se pudo eliminar');
      }
    } catch (e) {
      toast.error('Error de red al eliminar');
    }
  }

  async function toggleActive(item: WardrobeItem) {
    try {
      const res = await fetch(`/api/admin/wardrobe/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (res.ok) {
        toast.success(item.isActive ? 'Item desactivado' : 'Item activado');
        loadItems();
      }
    } catch (e) {
      toast.error('Error al cambiar estado');
    }
  }

  const filteredItems = items; // already filtered server-side

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Shirt className="h-9 w-9 text-orange-500" />
              Wardrobe / Catálogo
            </h1>
            <p className="text-muted-foreground mt-1">Administra los items del catálogo (Shopify-style). Vista, agrega y elimina productos del armario.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadItems} variant="outline" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
            <Button onClick={() => { setShowAddForm(!showAddForm); if (editingId) resetForm(); }} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="mr-2 h-4 w-4" />
              {showAddForm ? 'Cerrar formulario' : 'Agregar Item'}
            </Button>
          </div>
        </div>

        {/* Add / Edit Form */}
        {showAddForm && (
          <div className="mb-8 bg-card border border-border rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{editingId ? 'Editar Item' : 'Agregar Nuevo Item al Catálogo'}</h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Título *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Camisa Oxford Azul" />
                </div>
                <div>
                  <Label>Marca</Label>
                  <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Zara" />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Camisas" />
                </div>
                <div>
                  <Label>Precio</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="89.99" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Descripción</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Camisa clásica de algodón..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Color</Label>
                    <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Azul" />
                  </div>
                  <div>
                    <Label>Talla</Label>
                    <Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="M" />
                  </div>
                </div>
                <div>
                  <Label>Imagen URL</Label>
                  <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://... o /images/..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Shopify ID (opcional)</Label>
                    <Input value={form.shopifyId} onChange={(e) => setForm({ ...form, shopifyId: e.target.value })} placeholder="gid://shopify/Product/123" />
                  </div>
                  <div>
                    <Label>Tags (separados por coma)</Label>
                    <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="casual,algodon,verano" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.isActive} 
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
                  className="accent-orange-600" 
                />
                Activo / Visible en catálogo
              </label>

              <div className="flex-1" />

              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
                <Save className="mr-2 h-4 w-4" />
                {editingId ? 'Guardar Cambios' : 'Agregar al Catálogo'}
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por título, marca o descripción..." 
              className="pl-10" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            className="border border-border bg-background rounded-md px-3 py-2 text-sm min-w-[180px]"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => { setSearch(''); setCategoryFilter(''); }}>Limpiar filtros</Button>
        </div>

        {/* Items Table */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Cargando catálogo...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <Shirt className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay items en el catálogo todavía.</p>
              <Button onClick={() => setShowAddForm(true)} className="mt-4" variant="outline">Agregar primer item</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="p-4 font-medium">Item</th>
                    <th className="p-4 font-medium">Detalles</th>
                    <th className="p-4 font-medium">Precio</th>
                    <th className="p-4 font-medium">Shopify</th>
                    <th className="p-4 font-medium">Estado</th>
                    <th className="p-4 font-medium w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition">
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-12 h-12 object-cover rounded-lg border" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Shirt className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{item.title}</div>
                            {item.brand && <div className="text-xs text-muted-foreground">{item.brand}</div>}
                            {item.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div>{item.category || '—'}</div>
                        {(item.color || item.size) && <div className="text-xs text-muted-foreground">{[item.color, item.size].filter(Boolean).join(' / ')}</div>}
                        {item.tags && <div className="text-[10px] text-muted-foreground mt-0.5">{item.tags}</div>}
                      </td>
                      <td className="p-4 font-medium tabular-nums">
                        {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
                      </td>
                      <td className="p-4">
                        {item.shopifyId ? (
                          <a href={`https://admin.shopify.com/products/${item.shopifyId.split('/').pop()}`} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                            Ver en Shopify <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => toggleActive(item)}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${item.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500'}`}
                        >
                          {item.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => startEdit(item)} className="h-8 px-2">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(item.id, item.title)} className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          Los cambios se registran en Auditoría. Usa el campo Shopify ID para vincular con productos de tu tienda Shopify.
        </div>
      </div>
    </div>
  );
}
