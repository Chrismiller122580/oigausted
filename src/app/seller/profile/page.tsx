"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit3, Star, MapPin, Phone, TrendingUp, Save, Users } from "lucide-react";
import GrokAssistant from "@/components/common/GrokAssistant";
import { toast } from 'sonner';

export default function MiNegocioPage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Nuclear per-page defense against lingering Google Places widget pollution.
  // We no longer remove DOM nodes (was causing uncaught removeChild errors + React desync).
  // Just nuke the JS namespace. Global CSS + layout guard handle the rest.
  useLayoutEffect(() => {
    const cleanup = () => {
      try {
        const g = (window as any).google;
        if (g?.maps?.places) {
          try {
            g.maps.places = {
              Autocomplete: function() { return {}; },
              AutocompleteService: function() {},
              PlacesService: function() {},
              PlacesServiceStatus: {},
              RankBy: {},
              PlaceAutocompleteElement: function() {}
            };
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

  const [reviews, setReviews] = useState<any[]>([]);
  const [realStats, setRealStats] = useState({
    rating: 0,
    reviewCount: 0,
    gigCount: 0,
  });

  // Load existing data + real stats + reviews
  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;

      setFormData({
        businessName: user.businessName || "Mi Negocio Local",
        tagline: user.tagline || "Calidad y confianza que se nota",
        bio: user.bio || "Ofrecemos servicios profesionales con excelente atención.",
        phone: user.phone || "",
        whatsapp: user.whatsapp || "",
        location: user.city || "Bucaramanga, Santander",
        instagram: user.instagram || "",
        profilePicture: user.profilePicture || "",
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        serviceRadiusKm: user.serviceRadiusKm || 15,
      });

      // Load real rating/reviewCount
      setRealStats({
        rating: user.rating || 0,
        reviewCount: user.reviewCount || 0,
        gigCount: 0, // will update below
      });

      // Fetch recent reviews
      fetch(`/api/reviews?sellerId=${user.id}&limit=4`)
        .then(res => res.json())
        .then(data => setReviews(data.reviews || []))
        .catch(() => {});

      // Fetch gig count
      fetch(`/api/seller/gigs`)
        .then(res => res.json())
        .then(data => {
          setRealStats(prev => ({ ...prev, gigCount: data.count || 0 }));
        })
        .catch(() => {});
    }
  }, [session]);

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
        await update({
          ...formData,
          profilePicture: formData.profilePicture,
          image: formData.profilePicture,
        });
        toast.success("Información del negocio guardada correctamente");
        setIsEditing(false);
      } else {
        if (res.status === 401) {
          toast.error("Tu sesión expiró. Por favor inicia sesión de nuevo.");
          window.location.href = `/login?callbackUrl=${encodeURIComponent('/seller/profile')}`;
        } else {
          toast.error("Error al guardar");
        }
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const rating = 4.8;
  const reviewCount = 47;
  const totalGigs = 18;
  const totalEarnings = "12.450.000";

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/seller" className="inline-flex items-center gap-2 text-orange-600 hover:underline mb-8 text-lg">
          <ArrowLeft size={22} /> Volver al Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 gap-4">
          <h1 className="text-4xl font-bold text-foreground">Mi Negocio</h1>
          <div className="flex gap-3">
            <Link href={`/sellers/${(session?.user as any)?.id}`} target="_blank">
              <Button variant="outline">
                👀 Ver perfil público
              </Button>
            </Link>
            <Button onClick={isEditing ? handleSave : () => setIsEditing(true)} disabled={saving}>
              {isEditing ? (
                saving ? "Guardando..." : <><Save size={18} className="mr-2" /> Guardar Cambios</>
              ) : (
                <><Edit3 size={18} className="mr-2" /> Editar Negocio</>
              )}
            </Button>
          </div>
        </div>

        {/* DEV TESTING TOOLS - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 border-2 border-dashed border-orange-500 rounded-2xl bg-orange-50 dark:bg-orange-950/40">
            <div className="font-semibold text-orange-700 dark:text-orange-400 mb-3">🧪 DEV TESTING — Simulate Stats</div>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-card rounded-3xl p-10 shadow-sm border border-border">
            {/* ... same nice layout as before ... */}
            <div className="flex gap-10">
              <div className="flex-shrink-0">
                <div className="w-52 h-52 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 rounded-3xl overflow-hidden border-4 border-white dark:border-zinc-700 shadow-inner">
                  {formData.profilePicture ? (
                    <img src={formData.profilePicture} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl">🏪</div>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-3 text-xs text-center text-muted-foreground">
                    (Sube tu foto/logo en el editor de perfil general)
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Negocio</label>
                  <input name="businessName" value={formData.businessName} onChange={handleChange} disabled={!isEditing}
                    className="w-full px-6 py-5 text-2xl font-semibold bg-background border border-border text-foreground rounded-2xl focus:border-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tagline</label>
                  <input name="tagline" value={formData.tagline} onChange={handleChange} disabled={!isEditing}
                    className="w-full px-6 py-4 bg-background border border-border text-foreground rounded-2xl focus:border-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} rows={5}
                    className="w-full px-6 py-5 bg-background border border-border text-foreground rounded-2xl focus:border-orange-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Teléfono / WhatsApp</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                      className="w-full px-6 py-5 bg-background border border-border text-foreground rounded-2xl focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ubicación principal</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="Ciudad o dirección principal de tu negocio"
                        className="flex-1 px-6 py-5 bg-background border border-border text-foreground rounded-2xl focus:border-orange-500 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!navigator.geolocation) {
                            alert("Tu navegador no soporta geolocalización.");
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
                            () => alert("No pudimos obtener tu ubicación. Ingresa la dirección manualmente.")
                          );
                        }}
                        disabled={!isEditing}
                        className="px-4 py-2 border rounded-xl text-sm hover:bg-muted disabled:opacity-50"
                        title="Usar mi ubicación actual"
                      >
                        📍 Mi ubicación
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
                      className="w-full px-6 py-5 bg-background border border-border text-foreground rounded-2xl focus:border-orange-500" 
                      min="1"
                      max="200"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ¿Hasta cuántos km viajas para atender gigs? (Ej: 15 km). Esto ayuda a mostrar tus servicios solo a clientes cercanos.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Instagram</label>
                    <input name="instagram" value={formData.instagram} onChange={handleChange} disabled={!isEditing}
                      className="w-full px-6 py-5 bg-background border border-border text-foreground rounded-2xl focus:border-orange-500" placeholder="@tu_negocio" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6">Tu Reputación</h3>
                <div className="flex items-center gap-6">
                  <div className="text-6xl font-bold text-yellow-600">
                    {realStats.rating ? realStats.rating.toFixed(1) : "—"}
                  </div>
                  <div>
                    <div className="flex text-3xl text-yellow-500">★★★★☆</div>
                    <p className="text-muted-foreground mt-1">{realStats.reviewCount} reseñas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6">Estadísticas</h3>
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
                <CardContent className="p-8">
                  <h3 className="font-semibold text-xl mb-4">Últimas reseñas</h3>
                  <div className="space-y-4 text-sm">
                    {reviews.slice(0, 3).map((r, i) => (
                      <div key={i} className="border-l-4 border-yellow-400 pl-4">
                        <div className="flex gap-1 text-yellow-500">
                          {[1,2,3,4,5].map(n => <span key={n}>{n <= r.rating ? "★" : "☆"}</span>)}
                        </div>
                        <p className="text-muted-foreground mt-1 line-clamp-2">"{r.comment || 'Sin comentario'}"</p>
                        <p className="text-xs text-muted-foreground mt-1">— {r.reviewer?.name}</p>
                      </div>
                    ))}
                  </div>
                  <Link href={`/sellers/${(session?.user as any)?.id}`} className="text-xs text-orange-600 hover:underline mt-4 inline-block">
                    Ver todas en mi perfil público →
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <GrokAssistant />
      </div>
    </div>
  );
}
