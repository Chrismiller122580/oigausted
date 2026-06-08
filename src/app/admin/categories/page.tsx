'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Save, X, Tag, RefreshCw, AlertTriangle } from 'lucide-react';
import { gigCategories as staticGigCategories } from '@/lib/gig-categories';

interface FieldDef {
  key: string;
  label: string;
  type: 'number' | 'checkbox' | 'select';
  extraPrice?: number;
  options?: { label: string; extraPrice: number }[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string | null;
  fields: FieldDef[];
  isActive: boolean;
  order: number;
  gigCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [editingName, setEditingName] = useState<string | null>(null); // null = creating new
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🛠️');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrder, setFormOrder] = useState(0);
  const [formFields, setFormFields] = useState<FieldDef[]>([]);

  // Temp state for adding a new field
  const [newField, setNewField] = useState<Partial<FieldDef>>({
    key: '',
    label: '',
    type: 'number',
    extraPrice: 0,
  });
  const [newOption, setNewOption] = useState({ label: '', extraPrice: 0 });

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (res.ok) {
        setCategories(data.categories || []);
      } else {
        toast.error(data.error || 'Error loading categories');
      }
    } catch (e) {
      toast.error('Network error loading categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function resetForm() {
    setEditingName(null);
    setFormName('');
    setFormIcon('🛠️');
    setFormDescription('');
    setFormIsActive(true);
    setFormOrder(0);
    setFormFields([]);
    setNewField({ key: '', label: '', type: 'number', extraPrice: 0 });
    setNewOption({ label: '', extraPrice: 0 });
  }

  function startEdit(cat: Category) {
    setEditingName(cat.name);
    setFormName(cat.name);
    setFormIcon(cat.icon || '🛠️');
    setFormDescription(cat.description || '');
    setFormIsActive(cat.isActive);
    setFormOrder(cat.order || 0);
    setFormFields(cat.fields || []);
    setNewField({ key: '', label: '', type: 'number', extraPrice: 0 });
    setNewOption({ label: '', extraPrice: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function addField() {
    if (!newField.key || !newField.label) {
      toast.error('Key and label are required for the field');
      return;
    }
    const field: FieldDef = {
      key: newField.key.trim(),
      label: newField.label.trim(),
      type: (newField.type as any) || 'number',
      extraPrice: newField.type !== 'select' ? (newField.extraPrice || 0) : undefined,
      options: newField.type === 'select' ? [] : undefined,
    };
    setFormFields((prev) => [...prev, field]);
    setNewField({ key: '', label: '', type: 'number', extraPrice: 0 });
  }

  function removeField(index: number) {
    setFormFields((prev) => prev.filter((_, i) => i !== index));
  }

  function addOptionToField(fieldIndex: number) {
    if (!newOption.label) return;
    setFormFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIndex || f.type !== 'select') return f;
        const opts = [...(f.options || []), { ...newOption }];
        return { ...f, options: opts };
      })
    );
    setNewOption({ label: '', extraPrice: 0 });
  }

  function removeOption(fieldIndex: number, optIndex: number) {
    setFormFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIndex) return f;
        const opts = (f.options || []).filter((_, oi) => oi !== optIndex);
        return { ...f, options: opts };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = {
      name: formName.trim(),
      icon: formIcon || '🛠️',
      description: formDescription.trim() || null,
      fields: formFields,
      isActive: formIsActive,
      order: formOrder,
    };

    try {
      const method = editingName ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Error saving');
        return;
      }

      toast.success(editingName ? 'Category updated' : 'Category created successfully');
      resetForm();
      await loadCategories();
    } catch (err) {
      toast.error('Network error');
    }
  }

  async function toggleActive(cat: Category) {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cat.name,
          isActive: !cat.isActive,
        }),
      });
      if (res.ok) {
        toast.success(`Category ${!cat.isActive ? 'activated' : 'deactivated'}`);
        loadCategories();
      } else {
        const d = await res.json();
        toast.error(d.error);
      }
    } catch {
      toast.error('Error');
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/categories?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Category deleted');
        loadCategories();
      } else {
        toast.error(data.error || 'Could not delete');
      }
    } catch {
      toast.error('Network error');
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Tag className="h-8 w-8" /> Service Categories Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Create and manage gig categories. Categories define the dynamic price fields buyers see at checkout.
        </p>
      </div>

      {/* CREATE / EDIT FORM */}
      <Card>
        <CardHeader>
          <CardTitle>{editingName ? `Editing: ${editingName}` : 'Create New Category'}</CardTitle>
          <CardDescription>
            Dynamic fields allow adding extra prices based on the options the client chooses (e.g. number of rooms, materials, urgency).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category Name *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Plumbing and Plumbing Services"
                  required
                  disabled={!!editingName}
                />
                {editingName && <p className="text-xs text-muted-foreground mt-1">Name cannot be changed (used by existing gigs).</p>}
              </div>
              <div>
                <Label>Icon (emoji)</Label>
                <Input value={formIcon} onChange={(e) => setFormIcon(e.target.value)} placeholder="🚰" />
              </div>
            </div>

            <div>
              <Label>Description (for homepage and listings)</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Pipe repairs, faucets and hydraulic installations"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label>Order (to show first)</Label>
                <Input type="number" value={formOrder} onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 accent-orange-600"
                />
                <Label htmlFor="active">Active (visible to sellers)</Label>
              </div>
            </div>

            {/* FIELDS BUILDER */}
            <div>
              <Label className="text-base font-semibold">Dynamic Fields (variable pricing)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                These fields appear in the gig creation form and at checkout. They add to the base price based on what the buyer chooses.
              </p>

              {/* Current fields list */}
              {formFields.length > 0 && (
                <div className="space-y-3 mb-4">
                  {formFields.map((field, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{field.label} <span className="text-xs text-muted-foreground">({field.key})</span></div>
                          <div className="text-sm text-muted-foreground">Tipo: {field.type} {field.extraPrice != null && `• +$${field.extraPrice}`}</div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeField(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {field.type === 'select' && field.options && field.options.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 text-sm">
                          {field.options.map((opt, oidx) => (
                            <div key={oidx} className="flex justify-between py-0.5">
                              <span>{opt.label}</span>
                              <span className="flex items-center gap-2">
                                +${opt.extraPrice}
                                <button type="button" className="text-red-500" onClick={() => removeOption(idx, oidx)}>×</button>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {field.type === 'select' && (
                        <div className="mt-2 flex gap-2 items-end pl-4">
                          <Input
                            placeholder="Opción (ej: Pequeño)"
                            value={newOption.label}
                            onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                            className="h-8"
                          />
                          <Input
                            type="number"
                            placeholder="Extra $"
                            value={newOption.extraPrice}
                            onChange={(e) => setNewOption({ ...newOption, extraPrice: parseInt(e.target.value) || 0 })}
                            className="h-8 w-24"
                          />
                          <Button type="button" size="sm" variant="outline" onClick={() => addOptionToField(idx)}>
                            + Opción
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new field controls */}
              <div className="border rounded-lg p-4 bg-background">
                <div className="font-medium mb-2 text-sm">Add new field</div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input
                    placeholder="Clave (ej: rooms)"
                    value={newField.key}
                    onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                  />
                  <Input
                    placeholder="Etiqueta visible"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  />
                  <select
                    className="border rounded h-10 px-2 bg-background"
                    value={newField.type}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                  >
                    <option value="number">Número (ej: cantidad)</option>
                    <option value="checkbox">Checkbox (sí/no + precio)</option>
                    <option value="select">Select (opciones con precio)</option>
                  </select>
                  {newField.type !== 'select' && (
                    <Input
                      type="number"
                      placeholder="Precio extra"
                      value={newField.extraPrice || 0}
                      onChange={(e) => setNewField({ ...newField, extraPrice: parseInt(e.target.value) || 0 })}
                    />
                  )}
                  <Button type="button" onClick={addField} className="md:col-span-1">
                    <Plus className="h-4 w-4 mr-1" /> Add field
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">For "select" type, add options after creating the field.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {editingName ? 'Save changes' : 'Create category'}
              </Button>
              {editingName && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" /> Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* LIST */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Categories in DB: {categories.length} / Static: {staticGigCategories.length}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/categories', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ seedInitial: true }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success(data.message || 'Categorías sincronizadas');
                      await loadCategories();
                    } else {
                      toast.error(data.error || 'Error');
                    }
                  } catch {
                    toast.error('Network error');
                  }
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Sync initials
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={async () => {
                  if (!confirm(
                    `¿FORZAR RESET a las ${staticGigCategories.length} categorías iniciales?\n\n` +
                    `Esto eliminará cualquier categoría personalizada que no esté en la lista estática ` +
                    `(solo si no tiene gigs asociados). Esta acción es destructiva.`
                  )) return;

                  try {
                    const res = await fetch('/api/admin/categories', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ seedInitial: true, force: true }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success(data.message || 'Reset completado');
                      await loadCategories();
                    } else {
                      toast.error(data.error || 'Error en reset');
                    }
                  } catch {
                    toast.error('Error de red en reset');
                  }
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-1" /> Force reset to initials
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Cargando...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No categories in the database yet. 
                Static fallback definitions are currently in use (20 categories).
              </p>
              <Button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/categories', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ seedInitial: true }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success(data.message || 'Categorías iniciales importadas');
                      await loadCategories();
                    } else {
                      toast.error(data.error || 'Error al importar');
                    }
                  } catch {
                    toast.error('Error de red al importar categorías');
                  }
                }}
                className="mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" /> Import the 20 initial categories (recommended)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will populate the database so the admin and public pages use the managed categories.
                Use the "Force reset to initials" button (above) if you want to clean custom categories not in the static list.
              </p>
            </div>
          ) : (
            <>
              {categories.length < staticGigCategories.length && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <strong>Warning:</strong> Only {categories.length} categories in the database, 
                    but there are {staticGigCategories.length} known static definitions.
                    <br />
                    Click <strong>"Sync initials"</strong> above to import the missing ones 
                    (nothing will be deleted).
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Icon</th>
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Fields</th>
                    <th className="text-left py-2 pr-4">Gigs</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-right py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 text-2xl">{cat.icon}</td>
                      <td className="py-3 pr-4 font-medium">{cat.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{cat.fields?.length || 0} campos</td>
                      <td className="py-3 pr-4 text-muted-foreground">{cat.gigCount || 0}</td>
                      <td className="py-3 pr-4">
                        <button onClick={() => toggleActive(cat)} className="underline text-xs">
                          {cat.isActive ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(cat)}>
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          disabled={(cat.gigCount || 0) > 0}
                          onClick={() => handleDelete(cat.name)}
                          title={(cat.gigCount || 0) > 0 ? 'No se puede eliminar mientras haya gigs activos' : ''}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            Note: Categories with associated gigs cannot be deleted (use the deactivate button instead). Sellers only see active categories.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
