"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit3, Star, MapPin, Phone, TrendingUp, Save, Users, PartyPopper, Link2, Store } from "lucide-react";
// import GrokAssistant from "@/components/common/GrokAssistant"; // AI tool hidden per request (floating button disabled)
import { toast } from 'sonner';
import { slugify } from '@/lib/utils';
import { usePlatformConfig } from '@/components/providers/PlatformConfigProvider';
import ShowcaseGigPicker from '@/components/seller/ShowcaseGigPicker';

function slugifyForPreview(name?: string) {
  return slugify(name || '');
}

export default function MiNegocioPage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewBanner, setShowNewBanner] = useState(false);

  // Show a one-time "New!" nudge for the public profile feature
  useEffect(() => {
    if (session?.user) {
      const dismissed = localStorage.getItem('dismissedSellerPublicProfilePromo');
      if (!dismissed) {
        // Show if they have a business name (i.e. they are a seller)
        const user = session.user;
        if (user.businessName) {
          setShowNewBanner(true);
        }
      }
    }
  }, [session]);

  // Nuclear per-page defense against lingering Google Places widget pollution.
  // We no longer remove DOM nodes (was causing uncaught removeChild errors + React desync).
  // Just nuke the JS namespace. Global CSS + layout guard handle the rest.
  useLayoutEffect(() => {
    const cleanup = () => {
      try {
        const g = window.google;
        if (g?.maps?.places) {
          try {
            g.maps.places = {
              Autocomplete: function() { return {} as Record<string, never>; },
              AutocompleteService: function() {},
              PlacesService: function() {},
              PlacesServiceStatus: {},
              RankBy: {},
              PlaceAutocompleteElement: function() {}
            } satisfies NonNullable<GoogleMapsPlacesNamespace>;
          } catch {}
        }
      } catch (e) {}
    };

    cleanup();
    const t1 = setTimeout(cleanup, 0);
    const t2 = setTimeout(cleanup, 80);
    const t3 = setTimeout(cleanup, 300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const [formData, setFormData] = useState({
    businessName: "",
    tagline: "",
    bio: "",
    phone: "",
    whatsapp: "",
    location: "",
    instagram: "",
    profilePicture: "",
    latitude: null as number | null,
    longitude: null as number | null,
    serviceRadiusKm: 15,
  });
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  const [reviews, setReviews] = useState<import('@/types/order').OrderReview[]>([]);
  const [realStats, setRealStats] = useState({
    rating: 0,
    reviewCount: 0,
    gigCount: 0,
  });
  const { config: platformConfig } = usePlatformConfig();
  const maintenanceMode = !!platformConfig?.maintenanceMode;

  const applyProfileToForm = (user: {
    businessName?: string | null
    tagline?: string | null
    bio?: string | null
    phone?: string | null
    whatsapp?: string | null
    city?: string | null
    instagram?: string | null
    profilePicture?: string | null
    latitude?: number | null
    longitude?: number | null
    serviceRadiusKm?: number | null
    rating?: number | null
    reviewCount?: number | null
    slug?: string | null
    id?: string
  }) => {
    setFormData({
      businessName: user.businessName || "Mi Negocio Local",
      tagline: user.tagline || "Calidad y confianza que se nota",
      bio: user.bio || "Ofrecemos servicios profesionales con excelente atención.",
      phone: user.phone || "",
      whatsapp: user.whatsapp || "",
      location: user.city || "Bucaramanga, Santander",
      instagram: user.instagram || "",
      profilePicture: user.profilePicture || "",
      latitude: user.latitude ?? null,
      longitude: user.longitude ?? null,
      serviceRadiusKm: user.serviceRadiusKm ?? 15,
    })
    setRealStats(prev => ({
      ...prev,
      rating: user.rating || 0,
      reviewCount: user.reviewCount || 0,
    }))
    setPublicSlug(user.slug || user.id || null)
  }

  // Load from API (source of truth); skip while user is mid-edit
  useEffect(() => {
    const user = session?.user
    if (!user?.id) return

    if (!isEditing) {
      fetch('/api/user/profile')
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data?.user) applyProfileToForm(data.user)
          else applyProfileToForm(user)
        })
        .catch(() => applyProfileToForm(user))
    }

    fetch(`/api/reviews?sellerId=${user.id}&limit=4`)
      .then(res => res.json())
      .then(data => setReviews(data.reviews || []))
      .catch(() => {})

    fetch('/api/seller/gigs')
      .then(res => res.json())
      .then(data => {
        setRealStats(prev => ({ ...prev, gigCount: data.count || 0 }))
      })
      .catch(() => {})

  }, [session?.user?.id, isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          tagline: formData.tagline,
          bio: formData.bio,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          city: formData.location,
          instagram: formData.instagram,
          imageUrl: formData.profilePicture,
          latitude: formData.latitude,
          longitude: formData.longitude,
          serviceRadiusKm: formData.serviceRadiusKm,
        }),
      });

      if (res.ok) {
        const saved = await res.json().catch(() => ({}))
        await update({
          businessName: formData.businessName,
          tagline: formData.tagline,
          bio: formData.bio,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          location: formData.location,
          city: formData.location,
          instagram: formData.instagram,
          profilePicture: formData.profilePicture,
          image: formData.profilePicture,
          latitude: formData.latitude,
          longitude: formData.longitude,
          serviceRadiusKm: formData.serviceRadiusKm,
          role: session?.user?.role === 'seller' ? 'seller' : undefined,
        })
        if (saved?.user) applyProfileToForm(saved.user)
        toast.success("Información del negocio guardada correctamente")
        setIsEditing(false)
      } else {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast.error("Tu sesión expiró. Por favor inicia sesión de nuevo.");
          window.location.href = `/login?callbackUrl=${encodeURIComponent('/seller/profile')}`;
        } else {
          toast.error(err.error || "Error al guardar");
        }
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  // Use real data from session + fetched stats (removed hardcoded demo values for launch)

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link href="/seller" className="inline-flex items-center gap-2 text-orange-600 hover:underline mb-6 sm:mb-8 text-base sm:text-lg">
          <ArrowLeft size={20} className="sm:w-[22px] sm:h-[22px]" /> Volver al Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">Mi Negocio</h1>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button onClick={isEditing ? handleSave : () => setIsEditing(true)} disabled={saving} className="px-6 w-full sm:w-auto">
              {isEditing ? (
                saving ? "Guardando..." : <><Save size={18} className="mr-2" /> Guardar Cambios</>
              ) : (
                <><Edit3 size={18} className="mr-2" /> Editar Negocio</>
              )}
            </Button>
          </div>
        </div>

        {/* One-time New! onboarding nudge */}
        {showNewBanner && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-orange-600 text-white flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-semibold text-base sm:text-lg">
                <PartyPopper size={20} /> ¡Nuevo! Tu perfil público directo
              </div>
              <p className="text-orange-100 mt-1 text-sm">
                Ahora tienes tu propia dirección web personal (ej: oigagig.com/sellers/tu-negocio). 
                Compártela para conseguir más clientes directamente.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="border-white/70 text-white hover:bg-white/10 w-full sm:w-auto"
                onClick={() => {
                  localStorage.setItem('dismissedSellerPublicProfilePromo', 'true');
                  setShowNewBanner(false);
                }}
              >
                Entendido
              </Button>
              <Link href="#public-link-section" className="w-full sm:w-auto">
                <Button className="bg-white text-orange-600 hover:bg-white/90 w-full sm:w-auto">
                  Ver mi enlace
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* PROMINENT "Your Direct Web Address" - Let sellers know to use & share it */}
        <div id="public-link-section" className="mb-8 sm:mb-10 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-background border border-orange-200 dark:border-orange-900/50 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 items-center justify-center flex-shrink-0">
              <Link2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg sm:text-xl text-orange-900 dark:text-orange-100">Tu Dirección Pública Directa</h3>
                <span className="text-[10px] font-mono bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded shrink-0">NUEVO</span>
              </div>
              <p className="text-sm text-orange-800/80 dark:text-orange-200/80 mb-3">
                Este es tu enlace personal. Compártelo para que los clientes te encuentren directamente sin buscar en la plataforma.
              </p>

              {(() => {
                const linkSlug = publicSlug || slugifyForPreview(formData.businessName) || session?.user?.id;
                const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://oigagig.com'}/sellers/${linkSlug}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}&color=ea580c&bgcolor=ffffff&margin=10`;

                return (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-800/60 rounded-2xl p-3 sm:p-4">
                      <div className="font-mono text-xs sm:text-sm text-orange-700 dark:text-orange-300 break-all select-all mb-3">
                        {publicUrl}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(publicUrl);
                            toast.success('Enlace copiado al portapapeles');
                          }}
                          className="gap-1.5 w-full sm:w-auto"
                        >
                          Copiar enlace
                        </Button>
                        <Link href={`/sellers/${linkSlug}`} target="_blank" className="w-full sm:w-auto">
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 gap-1.5 w-full sm:w-auto">
                            Ver perfil público →
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = qrUrl;
                            link.download = `qr-${linkSlug || 'perfil'}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success('QR descargado');
                          }}
                          className="gap-1.5 w-full sm:w-auto"
                        >
                          Descargar QR
                        </Button>
                      </div>
                    </div>

                    {/* QR Code preview */}
                    <div className="flex justify-center">
                      <div className="bg-white p-3 rounded-2xl border border-orange-100 dark:border-orange-900/50 shadow-inner">
                        <img 
                          src={qrUrl} 
                          alt="QR code para tu perfil público" 
                          className="w-40 h-40 rounded-lg" 
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <p className="text-center text-[10px] text-muted-foreground mt-1">Escanea para abrir tu perfil</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-3 text-xs text-orange-700/70 dark:text-orange-300/70">
                Tip: Actualiza el <strong>Nombre del Negocio</strong> arriba para mejorar tu enlace (ej: <span className="font-mono">plomeria-juan-bucaramanga</span>). 
                Compártelo en WhatsApp, Instagram, tarjetas de presentación y flyers.
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <ShowcaseGigPicker
            publicProfileHref={`/sellers/${publicSlug || slugifyForPreview(formData.businessName) || session?.user?.id || ''}`}
          />
        </div>

        {/* DEBUG TOOLS - only visible when Modo Mantenimiento is active */}
        {maintenanceMode && (
          <div className="mb-8 p-4 border-2 border-dashed border-orange-500 rounded-2xl bg-orange-50 dark:bg-orange-950/40">
            <div className="font-semibold text-orange-700 dark:text-orange-400 mb-3">🧪 DEBUG TOOLS — Simulate Stats (maintenance mode)</div>
            <div className="flex flex-wrap gap-2 text-sm">
              <Button size="sm" variant="outline" onClick={() => {
                setRealStats({ rating: 4.9, reviewCount: 87, gigCount: 24 });
                toast.success('Stats simulated for testing');
              }}>
                Simulate High Reputation
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setRealStats({ rating: 3.2, reviewCount: 12, gigCount: 3 });
                toast.success('Stats simulated for testing');
              }}>
                Simulate New Seller
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">These only affect the local UI for testing seller dashboard states.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-8 bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-sm border border-border min-w-0">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
              <div className="flex-shrink-0 w-full md:w-auto flex flex-col items-center">
                <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-border dark:border-zinc-700 shadow-inner">
                  {formData.profilePicture ? (
                    <img src={formData.profilePicture} alt="Logo del Negocio" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight">
                      {formData.businessName ? (
                        formData.businessName.trim()[0].toUpperCase()
                      ) : (
                        <Store className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20" />
                      )}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-3 text-xs text-center text-muted-foreground">
                    (Sube tu foto/logo en el editor de perfil general)
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-5 sm:space-y-8 w-full min-w-0">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Negocio</label>
                  <input name="businessName" value={formData.businessName} onChange={handleChange} disabled={!isEditing}
                    className="w-full px-4 py-3 sm:px-6 sm:py-5 text-lg sm:text-2xl font-semibold bg-background border border-border text-foreground rounded-xl sm:rounded-2xl focus:border-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tagline</label>
                  <input name="tagline" value={formData.tagline} onChange={handleChange} disabled={!isEditing}
                    className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-background border border-border text-foreground rounded-xl sm:rounded-2xl focus:border-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} rows={5}
                    className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-background border border-border text-foreground rounded-xl sm:rounded-2xl focus:border-orange-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Teléfono</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                      className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-background border border-border text-foreground rounded-xl sm:rounded-2xl focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">WhatsApp (interno)</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} disabled={!isEditing}
                      className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-background border border-border text-foreground rounded-xl sm:rounded-2xl focus:border-orange-500" placeholder="+57 ..." />
                    <p className="text-xs text-muted-foreground mt-1">No se muestra a compradores. Ellos te contactan por el chat de Oigagig.</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Ubicación principal</label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Ciudad o dirección principal de tu negocio"
                        className="flex-1 min-w-0 px-4 py-3 sm:px-6 sm:py-5 bg-background border border-border text-foreground rounded-xl sm:rounded-2xl focus:border-orange-500 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!navigator.geolocation) {
                            toast.error("Tu navegador no soporta geolocalización.");
                            return;
                          }
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const lat = position.coords.latitude;
                              const lng = position.coords.longitude;
                              setFormData(prev => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng,
                                location: prev.location || `Ubicación actual (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                              }));
                            },
                            () => toast.error("No pudimos obtener tu ubicación. Ingresa la dirección manualmente.")
                          );
                        }}
                        disabled={!isEditing}
                        className="w-full sm:w-auto px-4 py-3 sm:py-5 border border-border rounded-xl sm:rounded-2xl text-sm hover:bg-muted disabled:opacity-60 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                        title="Usar mi ubicación actual"
                      >
                        <MapPin className="h-4 w-4" />
                        Mi ubicación
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Usaremos esto para mostrar "Gigs cerca de ti" a los compradores. (Sin Google Maps)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Radio de servicio (km)</label>
                    <input 
                      type="number" 
                      name="serviceRadiusKm" 
                      value={formData.serviceRadiusKm} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-background border border-border text-foreground rounded-xl sm:rounded-2xl focus:border-orange-500" 
                      min="1"
                      max="200"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ¿Hasta cuántos km viajas para atender gigs? (Ej: 15 km). Esto ayuda a mostrar tus servicios solo a clientes cercanos.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Instagram (interno)</label>
                    <input name="instagram" value={formData.instagram} onChange={handleChange} disabled={!isEditing}
                      className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-background border border-border text-foreground rounded-xl sm:rounded-2xl focus:border-orange-500" placeholder="@tu_negocio" />
                    <p className="text-xs text-muted-foreground mt-1">Tampoco aparece en tu perfil público.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 min-w-0">
            <Card>
              <CardContent className="p-4 sm:p-8">
                <h3 className="font-semibold text-lg sm:text-xl mb-4 sm:mb-6">Tu Reputación</h3>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-4xl sm:text-6xl font-bold text-yellow-600">
                    {realStats.rating ? realStats.rating.toFixed(1) : "—"}
                  </div>
                  <div>
                    <div className="flex text-2xl sm:text-3xl text-yellow-500">★★★★☆</div>
                    <p className="text-muted-foreground mt-1">{realStats.reviewCount} reseñas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-8">
                <h3 className="font-semibold text-lg sm:text-xl mb-4 sm:mb-6">Estadísticas</h3>
                <div className="space-y-6">
                  <div className="flex justify-between">
                    <span>Gigs publicados</span>
                    <span className="font-bold">{realStats.gigCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reseñas recibidas</span>
                    <span className="font-bold">{realStats.reviewCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews on own profile */}
            {reviews.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-8">
                  <h3 className="font-semibold text-lg sm:text-xl mb-4">Últimas reseñas</h3>
                  <div className="space-y-4 text-sm">
                    {reviews.slice(0, 3).map((r, i) => (
                      <div key={i} className="border-l-4 border-yellow-400 pl-4">
                        <div className="flex gap-1 text-yellow-500">
                          {[1,2,3,4,5].map(n => <span key={n}>{n <= r.rating ? "★" : "☆"}</span>)}
                        </div>
                        <p className="text-muted-foreground mt-1 line-clamp-2">"{r.comment || 'Sin comentario'}"</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          — {r.reviewer?.name} {r.order?.gig?.title ? `• ${r.order.gig.title}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Link href={`/sellers/${publicSlug || slugifyForPreview(formData.businessName) || session?.user?.id}`} className="text-xs text-orange-600 hover:underline mt-4 inline-block">
                    Ver todas en mi perfil público →
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* GrokAssistant (AI tool) hidden per request */}
      </div>
    </div>
  );
}
