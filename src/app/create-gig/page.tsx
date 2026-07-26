'use client';

import { useState, useEffect, Suspense } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGigCategories } from '@/lib/useGigCategories';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { MapPin, Camera, Sparkles, X } from 'lucide-react';
import { getAuthCallbackUrl } from "@/lib/getAuthCallbackUrl";
import type { CheckoutFormData, DynamicFieldDef, DynamicFieldOption, GigAddonOption } from '@/types/gig-fields';
import {
  SALE_DOCS_ADDON_KIND,
  SALE_DOCS_ADDON_NAME,
  SALE_DOCS_DEFAULT_PRICE,
} from '@/types/gig-fields';
import type { ChangeEvent, FormEvent } from 'react';
import { normalizeGigCategoryFields, normalizeFieldOptions, parseJsonArrayField } from '@/lib/utils';
import { getGigImages, MAX_GIG_IMAGES } from '@/lib/gig-images';
import { COLOMBIA_CITIES } from '@/lib/colombia-cities';
import { findSaleDocsAddon, isSaleDocsAddon } from '@/lib/vehicle-sale-docs';

const AUTOMOTIVE_CATEGORY = 'Venta de Autos y Vehículos';

function CreateGigClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const role = String(session?.user?.role || '').toLowerCase().trim();
  const canPublish = !!session && ['seller', 'admin'].includes(role);

  // Global + per-page nuke component handles Maps pollution defense.
  // We keep this import to ensure the component is in the tree early.

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [customOptions, setCustomOptions] = useState<GigAddonOption[]>([]);
  const [savedFields, setSavedFields] = useState<DynamicFieldDef[]>([]);
  const [completionTime, setCompletionTime] = useState('2-5 días');
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState<CheckoutFormData>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Geolocation for the gig
  const [gigLocation, setGigLocation] = useState("");
  const [gigLatitude, setGigLatitude] = useState<number | null>(null);
  const [gigLongitude, setGigLongitude] = useState<number | null>(null);
  const [isRemote, setIsRemote] = useState(false);
  const [loadingGig, setLoadingGig] = useState(false);

  // OigaGIG sale documents bundle (automotive only)
  const [saleDocsEnabled, setSaleDocsEnabled] = useState(false);
  const [saleDocsPrice, setSaleDocsPrice] = useState(SALE_DOCS_DEFAULT_PRICE);
  const [saleDocsCityId, setSaleDocsCityId] = useState('bucaramanga');

  const searchParams = useSearchParams();
  const { categories: gigCategories, loading: categoriesLoading } = useGigCategories();
  const selectedCategory = gigCategories.find(c => c.name === category);
  const categoryFields = selectedCategory
    ? normalizeGigCategoryFields(selectedCategory.fields)
    : [];

  // Clear dynamic form values when category changes (prevents stale data from previous category polluting pricing)
  useEffect(() => {
    if (category) {
      setFormData({});
    }
  }, [category]);

  const calculateTotal = () => {
    let total = basePrice || 0;
    categoryFields.forEach((field: DynamicFieldDef) => {
      const val = formData[field.key];
      if (!val) return;

      if (field.type === 'number' && val) {
        total += Number(val) * (field.extraPrice || 0);
      } else if (field.type === 'checkbox' && val) {
        total += field.extraPrice || 0;
      } else if (field.type === 'select') {
        const options = normalizeFieldOptions(field.options);
        const chosen = options.find((o: DynamicFieldOption) =>
          typeof o === 'string' ? o === val : o.label === val
        );
        if (chosen && typeof chosen === 'object' && chosen.extraPrice) {
          total += chosen.extraPrice;
        }
      }
    });
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
    if (!id) {
      setIsEditing(false);
      setEditId(null);
      return;
    }
    if (status === 'loading' || !session?.user?.id) return;

    setIsEditing(true);
    setEditId(id);
    loadGigForEdit(id);
  }, [editParam, status, session?.user?.id]);

  // Redirect unauthenticated or non-seller users
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      const callbackUrl = getAuthCallbackUrl("/create-gig");
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } else if (!canPublish) {
      router.replace('/profile');
    }
  }, [status, session?.user, canPublish, router]);

  const loadGigForEdit = async (id: string) => {
    setLoadingGig(true);
    try {
      const res = await fetch(`/api/gigs/${id}`);
      if (!res.ok) throw new Error('No se pudo cargar el gig');
      const gig = await res.json();

      const userId = session?.user?.id;
      const isAdmin = session?.user?.role === 'admin';
      if (userId && gig.sellerId !== userId && !isAdmin) {
        toast.error('No tienes permiso para editar este servicio');
        router.push('/seller/gigs');
        return;
      }

      setTitle(gig.title || '');
      setDescription(gig.description || '');
      setBasePrice(gig.price || 0);
      setCategory(gig.category || '');
      setImages(getGigImages(gig));
      const loadedAddons = parseJsonArrayField<GigAddonOption>(gig.addons);
      const saleAddon = findSaleDocsAddon(loadedAddons);
      setCustomOptions(loadedAddons.filter((a) => !isSaleDocsAddon(a)));
      if (saleAddon) {
        setSaleDocsEnabled(true);
        setSaleDocsPrice(Number(saleAddon.extraPrice) || SALE_DOCS_DEFAULT_PRICE);
        if (saleAddon.meta?.cityId) setSaleDocsCityId(String(saleAddon.meta.cityId));
      } else {
        setSaleDocsEnabled(false);
        setSaleDocsPrice(SALE_DOCS_DEFAULT_PRICE);
      }
      setSavedFields(parseJsonArrayField<DynamicFieldDef>(gig.fields));
      setCompletionTime(gig.completionTime || '2-5 días');

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
      router.push('/seller/gigs');
    } finally {
      setLoadingGig(false);
    }
  };

  const handleSmartFieldChange = (key: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_GIG_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_GIG_IMAGES} fotos por servicio`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.message(`Solo se subirán ${remaining} foto(s) (máximo ${MAX_GIG_IMAGES})`);
    }

    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
          uploaded.push(data.url);
        }
      }

      if (uploaded.length > 0) {
        setImages(prev => [...prev, ...uploaded]);
        toast.success(
          uploaded.length === 1
            ? 'Imagen subida correctamente'
            : `${uploaded.length} imágenes subidas correctamente`
        );
      } else {
        toast.error('Error subiendo imágenes');
      }
    } catch {
      toast.error('Error al subir las imágenes');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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
      if (!res.ok) {
        toast.error(data.error || "No se pudo generar la descripción");
        return;
      }
      if (data.description) {
        setDescription(data.description);
        toast.success("Descripción generada con Grok");
      } else {
        toast.error("Grok no devolvió descripción");
      }
    } catch (err) {
      toast.error("No se pudo conectar con Grok");
    }
    setGenerating(false);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!session) return toast.error("Debes iniciar sesión");
    if (!canPublish) return toast.error("Solo vendedores pueden publicar servicios");
    if (!title.trim()) return toast.error("El título es obligatorio");
    if (!category) return toast.error("Selecciona una categoría");
    if (!basePrice || basePrice <= 0) return toast.error("Ingresa un precio base válido");

    setSubmitting(true);

    const manualAddons = customOptions
      .filter((o) => o.name?.trim() && !isSaleDocsAddon(o))
      .map((o) => ({
        name: o.name.trim(),
        extraPrice: Number(o.extraPrice) || 0,
      }));

    const cityMeta = COLOMBIA_CITIES.find((c) => c.id === saleDocsCityId);
    const saleDocsAddon: GigAddonOption | null =
      category === AUTOMOTIVE_CATEGORY && saleDocsEnabled
        ? {
            name: SALE_DOCS_ADDON_NAME,
            extraPrice: Math.max(0, Math.round(Number(saleDocsPrice) || SALE_DOCS_DEFAULT_PRICE)),
            kind: SALE_DOCS_ADDON_KIND,
            meta: {
              cityId: saleDocsCityId,
              cityLabel: cityMeta?.label || saleDocsCityId,
            },
          }
        : null;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      price: basePrice, // base price only; buyer-selected options/fields/addons add extras on top at checkout time
      category,
      images,
      imageUrl: images[0] || null,
      fields: categoryFields.length
        ? categoryFields
        : (isEditing ? savedFields : []),
      addons: saleDocsAddon ? [...manualAddons, saleDocsAddon] : manualAddons,
      completionTime,
      // Geolocation
      city: gigLocation || cityMeta?.label || undefined,
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
        if (!isEditing) {
          trackEvent('gig_created', { category });
        }
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

  if (session && !canPublish) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Debes ser vendedor para publicar servicios.</p>
          <Button onClick={() => router.push('/profile')} className="bg-orange-600 hover:bg-orange-700">
            Ir a mi perfil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <MapsPollutionNuke />
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
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={categoriesLoading}
              required
              className="w-full border rounded-md p-3 text-base bg-background"
            >
              <option value="" disabled>
                {categoriesLoading
                  ? 'Cargando categorías...'
                  : gigCategories.length > 0
                    ? 'Selecciona una categoría'
                    : 'No hay categorías disponibles'}
              </option>
              {gigCategories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCategory && categoryFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles específicos de {selectedCategory.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              {categoryFields.map((field: DynamicFieldDef) => (
                <div key={field.key}>
                  <Label>{field.label} {field.extraPrice ? `(+$${field.extraPrice})` : ''}</Label>
                  {field.type === 'number' && (
                    <Input 
                      type="number" 
                      value={String(formData[field.key] ?? '')} 
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
                  {field.type === 'select' && (
                    <select 
                      value={String(formData[field.key] ?? '')} 
                      onChange={(e) => handleSmartFieldChange(field.key, e.target.value)}
                      className="mt-1 w-full border rounded-md p-2"
                    >
                      <option value="">Seleccionar...</option>
                      {normalizeFieldOptions(field.options).map((opt: DynamicFieldOption, idx: number) => {
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

        {/* OigaGIG vehicle sale documents bundle — automotive only */}
        {category === AUTOMOTIVE_CATEGORY && (
          <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="text-orange-900 dark:text-orange-100">
                Paquete de documentos OigaGIG
              </CardTitle>
              <p className="text-sm text-muted-foreground font-normal">
                Ofrece a tus compradores un contrato de compraventa y un checklist de papeles
                (SOAT, tecnomecánica, impuestos, traspaso) adaptados a la ciudad del trámite.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saleDocsEnabled}
                  onChange={(e) => setSaleDocsEnabled(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-orange-600"
                />
                <span>
                  <span className="font-medium text-foreground">
                    Ofrecer paquete de documentos OigaGIG
                  </span>
                  <span className="block text-sm text-muted-foreground mt-0.5">
                    El comprador puede añadirlo en el checkout. Tras el pago podrá descargar los documentos.
                  </span>
                </span>
              </label>

              {saleDocsEnabled && (
                <div className="grid sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <Label>Precio del paquete (COP)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={saleDocsPrice}
                      onChange={(e) => setSaleDocsPrice(Number(e.target.value) || 0)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sugerido: ${SALE_DOCS_DEFAULT_PRICE.toLocaleString('es-CO')} COP
                    </p>
                  </div>
                  <div>
                    <Label>Ciudad del traspaso / documentos</Label>
                    <select
                      value={saleDocsCityId}
                      onChange={(e) => setSaleDocsCityId(e.target.value)}
                      className="mt-1 w-full border rounded-md p-3 text-base bg-background"
                    >
                      {COLOMBIA_CITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} ({c.region})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      El checklist nombra la autoridad de tránsito e impuestos de esta ciudad.
                    </p>
                  </div>
                </div>
              )}
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
                      <X size={14} />
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
              value={completionTime} 
              onChange={(e) => setCompletionTime(e.target.value)} 
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
          <Label>Fotos del Servicio</Label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Sube hasta {MAX_GIG_IMAGES} fotos. La primera será la portada.
          </p>
          <div className="mt-2 space-y-4">
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative group rounded-2xl overflow-hidden border bg-muted flex items-center justify-center h-36">
                    <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-contain" />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Portada
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white w-7 h-7 rounded-full text-sm"
                      aria-label={`Quitar foto ${index + 1}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < MAX_GIG_IMAGES && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-orange-400 rounded-2xl p-8 cursor-pointer transition">
                <Camera className="h-10 w-10 mb-2 text-muted-foreground" />
                <span className="font-medium">
                  {images.length === 0 ? 'Subir fotos del servicio' : 'Agregar más fotos'}
                </span>
                <span className="text-sm text-muted-foreground mt-1">
                  PNG, JPG hasta 5MB · {images.length}/{MAX_GIG_IMAGES}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}

            {uploading && (
              <p className="text-sm text-orange-600 flex items-center gap-2">
                <span className="animate-spin">⏳</span> Subiendo imágenes...
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
              className="text-sm gap-1.5"
            >
              {generating ? "Generando..." : (
                <>
                  <Sparkles size={16} />
                  Generar descripción con IA
                </>
              )}
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
                  <div className="flex gap-2 items-center">
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
                      className="px-4 py-5 border border-border rounded-2xl text-sm hover:bg-muted flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <MapPin className="h-4 w-4" />
                      Mi ubicación
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
          disabled={submitting}
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
