'use client';

import { useState, useEffect, Suspense } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGigCategories } from '@/lib/useGigCategories';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import { getAuthCallbackUrl } from "@/lib/getAuthCallbackUrl";

function CreateGigClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const role = String((session?.user as any)?.role || '').toLowerCase().trim();
  const canPublish = !!session && ['seller', 'admin'].includes(role);

  // Global + per-page nuke component handles Maps pollution defense.
  // We keep this import to ensure the component is in the tree early.

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [customOptions, setCustomOptions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Geolocation for the gig
  const [gigLocation, setGigLocation] = useState("");
  const [gigLatitude, setGigLatitude] = useState<number | null>(null);
  const [gigLongitude, setGigLongitude] = useState<number | null>(null);
  const [isRemote, setIsRemote] = useState(false);
  const [loadingGig, setLoadingGig] = useState(false);

  const searchParams = useSearchParams();
  const { categories: gigCategories, loading: categoriesLoading } = useGigCategories();
  const selectedCategory = gigCategories.find(c => c.name === category);

  // Clear dynamic form values when category changes (prevents stale data from previous category polluting pricing)
  useEffect(() => {
    if (category) {
      setFormData({});
    }
  }, [category]);

  const calculateTotal = () => {
    let total = basePrice || 0;
    if (selectedCategory) {
      selectedCategory.fields.forEach((field: any) => {
        const val = formData[field.key];
        if (!val) return;

        if (field.type === 'number' && val) {
          total += Number(val) * (field.extraPrice || 0);
        } else if (field.type === 'checkbox' && val) {
          total += field.extraPrice || 0;
        } else if (field.type === 'select' && field.options) {
          // Support both string options and {label, extraPrice} objects
          const chosen = field.options.find((o: any) => (typeof o === 'string' ? o === val : o.label === val));
          if (chosen && typeof chosen === 'object' && chosen.extraPrice) {
            total += chosen.extraPrice;
          }
        }
      });
    }
    customOptions.forEach(opt => {
      if (opt.extraPrice) total += Number(opt.extraPrice || 0);
    });
    return Math.round(total);
  };

  const totalPrice = calculateTotal();

  // Detect edit mode from ?edit=gigId and load existing gig
  // Use a stable primitive for the dependency to avoid re-running on every
  // internal state change (e.g. selecting a category) which was causing
  // the loadingGig spinner to re-appear in production.
  const editParam = searchParams.get('edit');
  useEffect(() => {
    const id = editParam;
    if (id) {
      setIsEditing(true);
      setEditId(id);
      loadGigForEdit(id);
    } else {
      setIsEditing(false);
      setEditId(null);
    }
  }, [editParam]);

  // Redirect unauthenticated users to login (with return to create-gig)
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      const callbackUrl = getAuthCallbackUrl("/create-gig");
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, session?.user, router]);

  const loadGigForEdit = async (id: string) => {
    setLoadingGig(true);
    try {
      const res = await fetch(`/api/gigs/${id}`);
      if (!res.ok) throw new Error('No se pudo cargar el gig');
      const gig = await res.json();

      setTitle(gig.title || '');
      setDescription(gig.description || '');
      setBasePrice(gig.price || 0);
      setCategory(gig.category || '');
      setImageUrl(gig.imageUrl || '');
      setCustomOptions(gig.addons || []);

      // Restore geolocation if present on the gig
      setGigLocation(gig.city || '');
      setGigLatitude(gig.latitude ?? null);
      setGigLongitude(gig.longitude ?? null);
      setIsRemote(gig.isRemote ?? false);

      // Note: dynamic formData values are not persisted per-gig,
      // so we leave them empty. Seller can reconfigure if needed.
      setFormData({});
    } catch (err) {
      toast.error("Error cargando el servicio para editar");
      router.push('/seller');
    } finally {
      setLoadingGig(false);
    }
  };

  const handleSmartFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setImageUrl(data.url);
        toast.success("Imagen subida correctamente");
      } else {
        toast.error("Error subiendo imagen");
      }
    } catch (err) {
      toast.error("Error al subir la imagen");
    }
    setUploading(false);
  };

  const generateWithGrok = async () => {
    if (!title || !category) {
      return toast.error("Escribe un título y selecciona categoría");
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, type: 'gig-description' })
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
        toast.success("✅ Descripción generada con Grok");
      } else {
        toast.error("Grok no devolvió descripción");
      }
    } catch (err) {
      toast.error("No se pudo conectar con Grok");
    }
    setGenerating(false);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!session) return toast.error("Debes iniciar sesión");
    if (!canPublish) return toast.error("Solo vendedores pueden publicar servicios");
    if (!title.trim()) return toast.error("El título es obligatorio");
    if (!category) return toast.error("Selecciona una categoría");
    if (!basePrice || basePrice <= 0) return toast.error("Ingresa un precio base válido");

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      price: basePrice, // base price only; buyer-selected options/fields/addons add extras on top at checkout time
      category,
      imageUrl: imageUrl || null,
      fields: selectedCategory?.fields || [],
      addons: customOptions.filter(o => o.name?.trim()),
      completionTime: "2-5 días",
      // Geolocation
      city: gigLocation || undefined,
      latitude: gigLatitude,
      longitude: gigLongitude,
      isRemote,
    };

    const url = isEditing && editId ? `/api/gigs/${editId}` : '/api/gigs';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEditing ? "¡Servicio actualizado exitosamente!" : "¡Servicio publicado exitosamente!");
        router.push('/seller/gigs'); // Go to the new management page
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (isEditing ? "Error al actualizar" : "Error al publicar"));
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingGig) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando servicio para editar...</p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Verificando permisos de vendedor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <MapsPollutionNuke />
      {!canPublish && session && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl text-center">
          <p className="text-amber-800 font-medium mb-2">Debes ser vendedor para publicar servicios.</p>
          <p className="text-sm text-amber-700 mb-4">Actualiza tu perfil para convertirte en vendedor y comenzar a publicar gigs.</p>
          <Button onClick={() => router.push('/profile')} className="bg-amber-600 hover:bg-amber-700">
            Ir a mi perfil
          </Button>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          {isEditing ? "Editar Servicio" : "Publica tu Servicio"}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {isEditing 
            ? "Actualiza los detalles. Los cambios se reflejarán inmediatamente en tu perfil y en búsquedas."
            : "Crea un servicio atractivo para que los compradores te encuentren fácilmente."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Título del Servicio</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading && <SelectItem value="" disabled>Cargando categorías...</SelectItem>}
                {gigCategories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
                {!categoriesLoading && gigCategories.length === 0 && (
                  <SelectItem value="" disabled>No hay categorías disponibles</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles específicos de {selectedCategory.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              {selectedCategory.fields.map((field: any, i: number) => (
                <div key={i}>
                  <Label>{field.label} {field.extraPrice ? `(+$${field.extraPrice})` : ''}</Label>
                  {field.type === 'number' && (
                    <Input 
                      type="number" 
                      value={formData[field.key] || ''} 
                      onChange={(e) => handleSmartFieldChange(field.key, e.target.value)}
                      className="mt-1"
                    />
                  )}
                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-3 mt-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!formData[field.key]} 
                        onChange={(e) => handleSmartFieldChange(field.key, e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <span>{field.label}</span>
                    </label>
                  )}
                  {field.type === 'select' && field.options && (
                    <select 
                      value={formData[field.key] || ''} 
                      onChange={(e) => handleSmartFieldChange(field.key, e.target.value)}
                      className="mt-1 w-full border rounded-md p-2"
                    >
                      <option value="">Seleccionar...</option>
                      {field.options.map((opt: any, idx: number) => {
                        const label = typeof opt === 'string' ? opt : opt.label;
                        const price = typeof opt === 'object' && opt.extraPrice ? ` (+$${opt.extraPrice})` : '';
                        return <option key={idx} value={label}>{label}{price}</option>;
                      })}
                    </select>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Custom Addons - High value for sellers */}
        <Card>
          <CardHeader>
            <CardTitle>Opciones Adicionales (Addons)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customOptions.length > 0 && (
              <div className="space-y-2">
                {customOptions.map((opt, index) => (
                  <div key={index} className="flex gap-3 items-center bg-muted p-3 rounded-xl">
                    <div className="flex-1">
                      <Input 
                        value={opt.name} 
                        onChange={(e) => {
                          const newOpts = [...customOptions];
                          newOpts[index].name = e.target.value;
                          setCustomOptions(newOpts);
                        }}
                        placeholder="Nombre de la opción (ej: Entrega express)"
                      />
                    </div>
                    <div className="w-36">
                      <Input 
                        type="number" 
                        value={opt.extraPrice || ''} 
                        onChange={(e) => {
                          const newOpts = [...customOptions];
                          newOpts[index].extraPrice = Number(e.target.value);
                          setCustomOptions(newOpts);
                        }}
                        placeholder="Precio extra"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setCustomOptions(customOptions.filter((_, i) => i !== index));
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomOptions([...customOptions, { name: '', extraPrice: 0 }])}
            >
              + Agregar opción adicional
            </Button>
            <p className="text-xs text-muted-foreground">Los compradores podrán elegir estas opciones durante el checkout.</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Precio Base (COP)</Label>
            <Input 
              type="number" 
              value={basePrice} 
              onChange={(e) => setBasePrice(Number(e.target.value))} 
              required 
              min="0"
            />
          </div>
          <div>
            <Label>Tiempo Estimado de Entrega</Label>
            <select 
              value="2-5 días" 
              onChange={() => {}} 
              className="w-full border rounded-md p-3 text-base"
            >
              <option>1-2 días</option>
              <option>2-5 días</option>
              <option>5-7 días</option>
              <option>1-2 semanas</option>
              <option>A convenir</option>
            </select>
          </div>
        </div>

        <div>
          <Label>Imagen del Servicio</Label>
          <div className="mt-2">
            {!imageUrl ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-orange-400 rounded-2xl p-8 cursor-pointer transition">
                <div className="text-4xl mb-2">📷</div>
                <span className="font-medium">Subir imagen del servicio</span>
                <span className="text-sm text-muted-foreground mt-1">PNG, JPG hasta 5MB</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
            ) : (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="preview" 
                  className="w-full max-h-72 object-cover rounded-2xl border" 
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-3 right-3 bg-card/90 text-foreground px-3 py-1 rounded-full text-sm hover:bg-muted"
                >
                  Quitar imagen
                </button>
              </div>
            )}
            {uploading && (
              <p className="text-sm text-orange-600 mt-2 flex items-center gap-2">
                <span className="animate-spin">⏳</span> Subiendo imagen...
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Descripción del Servicio</Label>
            <Button 
              type="button" 
              variant="outline" 
              onClick={generateWithGrok} 
              disabled={generating || !title || !category}
              className="text-sm"
            >
              {generating ? "Generando..." : "✨ Generar descripción con IA"}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
        </div>

        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-medium">Precio Total Estimado</span>
              <span className="text-4xl font-bold text-orange-600">
                ${totalPrice.toLocaleString('es-CO')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Precio base del servicio. Las opciones y addons que configures aquí son para tu estimación; los compradores los eligen y pagan los extras adicionales en el checkout.</p>
          </CardContent>
        </Card>

        {/* Geolocation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Ubicación del servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={isRemote} 
                onChange={(e) => setIsRemote(e.target.checked)} 
                className="w-4 h-4" 
              />
              <label>Este servicio se puede realizar de forma remota / online</label>
            </div>

            {!isRemote && (
              <>
                <div>
                  <Label>Dirección o ciudad donde ofreces el servicio</Label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={gigLocation}
                      onChange={(e) => {
                        setGigLocation(e.target.value);
                        // Clear coords if user edits manually
                        setGigLatitude(null);
                        setGigLongitude(null);
                      }}
                      placeholder="Ej: Calle 45 #23-12, Bucaramanga"
                      className="flex-1 border rounded-xl px-4 py-3"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!navigator.geolocation) {
                          toast.error("Tu navegador no soporta geolocalización");
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            setGigLatitude(lat);
                            setGigLongitude(lng);
                            if (!gigLocation) {
                              setGigLocation(`Mi ubicación actual (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                            }
                          },
                          () => toast.error("No se pudo obtener la ubicación")
                        );
                      }}
                      className="px-4 py-2 border rounded-xl text-sm hover:bg-muted"
                    >
                      📍 Mi ubicación
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los compradores verán la distancia aproximada. Puedes dejarlo en blanco si prefieres no mostrar ubicación exacta. (Sin Google Maps)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground text-center">
          Al publicar, tu servicio aparecerá en el marketplace y podrás gestionarlo desde <span className="font-medium">"Mis Gigs"</span>.
        </div>

        <Button 
          type="submit" 
          disabled={submitting || !canPublish}
          className="w-full py-7 text-lg font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-70"
        >
          {submitting 
            ? (isEditing ? "Guardando cambios..." : "Publicando servicio...") 
            : (isEditing ? "Guardar Cambios" : "Publicar Servicio")}
        </Button>
      </form>
    </div>
  );
}

// Wrapper with Suspense for the ?edit= search param (prevents prod load errors)
export default function CreateGigPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando formulario...</p>
        </div>
      </div>
    }>
      <CreateGigClient />
    </Suspense>
  );
}
