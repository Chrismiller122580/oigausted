"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit3, Star, MapPin, Phone, TrendingUp, Save } from "lucide-react";
import GrokAssistant from "@/components/common/GrokAssistant";
import { toast } from 'react-hot-toast';

export default function MiNegocioPage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    tagline: "",
    bio: "",
    phone: "",
    whatsapp: "",
    location: "",
    instagram: "",
    profilePicture: "",
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
        }),
      });

      if (res.ok) {
        await update();
        toast.success("Información del negocio guardada correctamente");
        setIsEditing(false);
      } else {
        toast.error("Error al guardar");
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
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/seller" className="inline-flex items-center gap-2 text-orange-600 hover:underline mb-8 text-lg">
          <ArrowLeft size={22} /> Volver al Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 gap-4">
          <h1 className="text-4xl font-bold">Mi Negocio</h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-3xl p-10 shadow-sm border">
            {/* ... same nice layout as before ... */}
            <div className="flex gap-10">
              <div className="flex-shrink-0">
                <div className="w-52 h-52 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl overflow-hidden border-4 border-white shadow-inner">
                  {formData.profilePicture ? (
                    <img src={formData.profilePicture} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl">🏪</div>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-3 text-xs text-center text-gray-500">
                    (Sube tu foto/logo en el editor de perfil general)
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-8">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del Negocio</label>
                  <input name="businessName" value={formData.businessName} onChange={handleChange} disabled={!isEditing}
                    className="w-full px-6 py-5 text-2xl font-semibold border rounded-2xl focus:border-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tagline</label>
                  <input name="tagline" value={formData.tagline} onChange={handleChange} disabled={!isEditing}
                    className="w-full px-6 py-4 border rounded-2xl focus:border-orange-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} rows={5}
                    className="w-full px-6 py-5 border rounded-2xl focus:border-orange-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Teléfono / WhatsApp</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                      className="w-full px-6 py-5 border rounded-2xl focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ubicación</label>
                    <input name="location" value={formData.location} onChange={handleChange} disabled={!isEditing}
                      className="w-full px-6 py-5 border rounded-2xl focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Instagram</label>
                    <input name="instagram" value={formData.instagram} onChange={handleChange} disabled={!isEditing}
                      className="w-full px-6 py-5 border rounded-2xl focus:border-orange-500" placeholder="@tu_negocio" />
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
                    <p className="text-gray-600 mt-1">{realStats.reviewCount} reseñas</p>
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
                        <p className="text-gray-600 mt-1 line-clamp-2">"{r.comment || 'Sin comentario'}"</p>
                        <p className="text-xs text-gray-400 mt-1">— {r.reviewer?.name}</p>
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
