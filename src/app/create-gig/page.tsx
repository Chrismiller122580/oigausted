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
import { isQuantityField } from '@/lib/order-price';
import { seedQuantityDefaults, restoreGigFieldValues, fieldsWithPersistedValues } from '@/lib/persist-gig-fields';

const AUTOMOTIVE_CATEGORY = 'Venta de Autos y Vehículos';
const TECH_REPAIR_CATEGORY = 'Reparación de Computadores y Electrónica';

function CreateGigClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = String(session?.user?.role || '').toLowerCase().trim();
  const canPublish = !!session && ['seller', 'admin'].includes(role);

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
  const [gigLocation, setGigLocation] = useState('');
  const [gigLatitude, setGigLatitude] = useState<number | null>(null);
  const [gigLongitude, setGigLongitude] = useState<number | null>(null);
  const [isRemote, setIsRemote] = useState(false);
  const [loadingGig, setLoadingGig] = useState(false);
  const [saleDocsEnabled, setSaleDocsEnabled] = useState(false);
  const [saleDocsPrice, setSaleDocsPrice] = useState(SALE_DOCS_DEFAULT_PRICE);
  const [saleDocsCityId, setSaleDocsCityId] = useState('bucaramanga');
  const [submitting, setSubmitting] = useState(false);

  const searchParams = useSearchParams();
  const { categories: gigCategories, loading: categoriesLoading } = useGigCategories();
  const selectedCategory = gigCategories.find(c => c.name === category);
  const categoryFields = selectedCategory ? normalizeGigCategoryFields(selectedCategory.fields) : [];

  useEffect(() => {
    if (!category) return;
    setFormData((prev) => seedQuantityDefaults(categoryFields, prev));
  }, [category]);

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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      const callbackUrl = getAuthCallbackUrl('/create-gig');
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
      setGigLocation(gig.city || '');
      setGigLatitude(gig.latitude ?? null);
      setGigLongitude(gig.longitude ?? null);
      setIsRemote(gig.isRemote ?? false);
      setFormData(restoreGigFieldValues(parseJsonArrayField<DynamicFieldDef>(gig.fields)));
    } catch {
      toast.error('Error cargando el servicio para editar');
      router.push('/seller/gigs');
    } finally {
      setLoadingGig(false);
    }
  };

  const handleSmartFieldChange = (key: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) uploaded.push(data.url);
      }
      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded]);
        toast.success(uploaded.length === 1 ? 'Imagen subida correctamente' : `${uploaded.length} imágenes subidas correctamente`);
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

  const generateWithGrok = async () => {
    if (!title || !category) return toast.error('Escribe un título y selecciona categoría');
    setGenerating(true);
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, type: 'gig-description' }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'No se pudo generar la descripción');
      if (data.description) {
        setDescription(data.description);
        toast.success('Descripción generada con Grok');
      }
    } catch {
      toast.error('No se pudo conectar con Grok');
    }
    setGenerating(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return toast.error('Debes iniciar sesión');
    if (!canPublish) return toast.error('Solo vendedores pueden publicar servicios');
    if (!title.trim()) return toast.error('El título es obligatorio');
    if (!category) return toast.error('Selecciona una categoría');
    if (!basePrice || basePrice <= 0) return toast.error('Ingresa un precio base válido');
    setSubmitting(true);
    const manualAddons = customOptions.filter((o) => o.name?.trim() && !isSaleDocsAddon(o)).map((o) => ({ name: o.name.trim(), extraPrice: Number(o.extraPrice) || 0 }));
    const cityMeta = COLOMBIA_CITIES.find((c) => c.id === saleDocsCityId);
    const saleDocsAddon: GigAddonOption | null = category === AUTOMOTIVE_CATEGORY && saleDocsEnabled ? { name: SALE_DOCS_ADDON_NAME, extraPrice: Math.max(0, Math.round(Number(saleDocsPrice) || SALE_DOCS_DEFAULT_PRICE)), kind: SALE_DOCS_ADDON_KIND, meta: { cityId: saleDocsCityId, cityLabel: cityMeta?.label || saleDocsCityId } } : null;
    const sourceFields = categoryFields.length ? categoryFields : (isEditing ? savedFields : []);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      price: basePrice,
      category,
      images,
      imageUrl: images[0] || null,
      fields: fieldsWithPersistedValues(sourceFields, formData),
      addons: saleDocsAddon ? [...manualAddons, saleDocsAddon] : manualAddons,
      completionTime,
      city: gigLocation || cityMeta?.label || undefined,
      latitude: gigLatitude,
      longitude: gigLongitude,
      isRemote,
    };
    try {
      const res = await fetch(isEditing && editId ? `/api/gigs/${editId}` : '/api/gigs', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (!isEditing) trackEvent('gig_created', { category });
        toast.success(isEditing ? '¡Servicio actualizado exitosamente!' : '¡Servicio publicado exitosamente!');
        router.push('/seller/gigs');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || (isEditing ? 'Error al actualizar' : 'Error al publicar'));
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingGig || status === 'loading') {
    return (
      <div className="max-w-4xl mx-auto p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{loadingGig ? 'Cargando servicio para editar...' : 'Verificando permisos de vendedor...'}</p>
        </div>
      </div>
    );
  }

  if (session && !canPublish) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-lg text-muted-foreground mb-4">Debes ser vendedor para publicar servicios.</p>
        <Button onClick={() => router.push('/profile')} className="bg-orange-600">Ir a mi perfil</Button>
      </div>
    );
  }

  const totalPrice = Math.round((basePrice || 0) + customOptions.reduce((s, o) => s + (Number(o.extraPrice) || 0), 0));

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <MapsPollutionNuke />
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{isEditing ? 'Editar Servicio' : 'Publica tu Servicio'}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{isEditing ? 'Actualiza los detalles. Los cambios se reflejarán inmediatamente.' : 'Crea un servicio atractivo para que los compradores te encuentren.'}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Título del Servicio</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Categoría</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={categoriesLoading} required className="w-full border rounded-md p-3 text-base bg-background">
              <option value="" disabled>{categoriesLoading ? 'Cargando categorías...' : 'Selecciona una categoría'}</option>
              {gigCategories.map((cat) => (
                <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedCategory && categoryFields.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Detalles específicos de {selectedCategory.name}</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              {categoryFields.map((field: DynamicFieldDef) => (
                <div key={field.key}>
                  <Label>{field.label} {field.extraPrice && !isQuantityField(field) ? `(+$${field.extraPrice})` : ''}</Label>
                  {field.type === 'number' && (
                    <Input type="number" min={isQuantityField(field) ? 1 : 0} value={String(formData[field.key] ?? (isQuantityField(field) ? 1 : ''))} onChange={(e) => handleSmartFieldChange(field.key, isQuantityField(field) ? Math.max(1, parseInt(e.target.value, 10) || 1) : e.target.value)} className="mt-1" />
                  )}
                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-3 mt-2 cursor-pointer">
                      <input type="checkbox" checked={!!formData[field.key]} onChange={(e) => handleSmartFieldChange(field.key, e.target.checked)} className="w-5 h-5 accent-orange-600" />
                      <span>{field.label}</span>
                    </label>
                  )}
                  {field.type === 'select' && (
                    <select value={String(formData[field.key] ?? '')} onChange={(e) => handleSmartFieldChange(field.key, e.target.value)} className="mt-1 w-full border rounded-md p-2">
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

        {category === AUTOMOTIVE_CATEGORY && (
          <Card className="border-orange-200 bg-orange-50/40">
            <CardHeader><CardTitle>Paquete de documentos OigaGIG</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={saleDocsEnabled} onChange={(e) => setSaleDocsEnabled(e.target.checked)} className="mt-1 w-5 h-5 accent-orange-600" />
                <span className="font-medium">Ofrecer paquete de documentos OigaGIG</span>
              </label>
              {saleDocsEnabled && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Precio del paquete (COP)</Label>
                    <Input type="number" min={0} value={saleDocsPrice} onChange={(e) => setSaleDocsPrice(Number(e.target.value) || 0)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Ciudad del traspaso</Label>
                    <select value={saleDocsCityId} onChange={(e) => setSaleDocsCityId(e.target.value)} className="mt-1 w-full border rounded-md p-3">
                      {COLOMBIA_CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Opciones Adicionales (Addons)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {customOptions.map((opt, index) => (
              <div key={index} className="flex gap-3 items-center bg-muted p-3 rounded-xl">
                <Input value={opt.name} onChange={(e) => { const n = [...customOptions]; n[index].name = e.target.value; setCustomOptions(n); }} placeholder="Nombre de la opción" />
                <Input type="number" className="w-36" value={opt.extraPrice || ''} onChange={(e) => { const n = [...customOptions]; n[index].extraPrice = Number(e.target.value); setCustomOptions(n); }} placeholder="Precio extra" />
                <Button type="button" variant="outline" size="sm" onClick={() => setCustomOptions(customOptions.filter((_, i) => i !== index))}><X size={14} /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setCustomOptions([...customOptions, { name: '', extraPrice: 0 }])}>+ Agregar opción adicional</Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Precio Base (COP)</Label>
            <Input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} required min={0} />
          </div>
          <div>
            <Label>Tiempo Estimado de Entrega</Label>
            <select value={completionTime} onChange={(e) => setCompletionTime(e.target.value)} className="w-full border rounded-md p-3">
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
          <p className="text-sm text-muted-foreground mt-1 mb-3">Sube hasta {MAX_GIG_IMAGES} fotos. La primera será la portada.</p>
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {images.map((url, index) => (
                <div key={`${url}-${index}`} className="relative rounded-2xl overflow-hidden border h-36">
                  <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-contain" />
                  <button type="button" onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))} className="absolute top-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full">×</button>
                </div>
              ))}
            </div>
          )}
          {images.length < MAX_GIG_IMAGES && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer">
              <Camera className="h-10 w-10 mb-2 text-muted-foreground" />
              <span className="font-medium">{images.length === 0 ? 'Subir fotos del servicio' : 'Agregar más fotos'}</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          )}
          {uploading && <p className="text-sm text-orange-600 mt-2">Subiendo imágenes...</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Descripción del Servicio</Label>
            <Button type="button" variant="outline" onClick={generateWithGrok} disabled={generating || !title || !category} className="text-sm gap-1.5">
              {generating ? 'Generando...' : (<><Sparkles size={16} /> Generar descripción con IA</>)}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
        </div>

        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6 flex justify-between items-baseline">
            <span className="text-lg font-medium">Precio Base</span>
            <span className="text-4xl font-bold text-orange-600">${totalPrice.toLocaleString('es-CO')}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Ubicación del servicio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="w-4 h-4" />
              Este servicio se puede realizar de forma remota / online
            </label>
            {!isRemote && (
              <Input value={gigLocation} onChange={(e) => { setGigLocation(e.target.value); setGigLatitude(null); setGigLongitude(null); }} placeholder="Ej: Calle 45 #23-12, Bucaramanga" />
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={submitting} className="w-full py-7 text-lg font-semibold bg-orange-600 hover:bg-orange-700">
          {submitting ? (isEditing ? 'Guardando cambios...' : 'Publicando servicio...') : (isEditing ? 'Guardar Cambios' : 'Publicar Servicio')}
        </Button>
      </form>
    </div>
  );
}

export default function CreateGigPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando formulario...</div>}>
      <CreateGigClient />
    </Suspense>
  );
}
