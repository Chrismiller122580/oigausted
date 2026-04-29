"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit3, Star, MapPin, Phone, TrendingUp, Save } from "lucide-react";
import GrokAssistant from "@/components/common/GrokAssistant";

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
  });

  // Load existing data
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
      });
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
        }),
      });

      if (res.ok) {
        await update();
        alert("✅ Información del negocio guardada correctamente");
        setIsEditing(false);
      } else {
        alert("❌ Error al guardar");
      }
    } catch (err) {
      alert("Error de conexión");
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

        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Mi Negocio</h1>
          <Button onClick={isEditing ? handleSave : () => setIsEditing(true)} disabled={saving}>
            {isEditing ? (
              saving ? "Guardando..." : <><Save size={18} className="mr-2" /> Guardar Cambios</>
            ) : (
              <><Edit3 size={18} className="mr-2" /> Editar Negocio</>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-3xl p-10 shadow-sm border">
            {/* ... same nice layout as before ... */}
            <div className="flex gap-10">
              <div className="flex-shrink-0">
                <div className="w-52 h-52 bg-gradient-to-br from-orange-100 to-amber-100 rounded-3xl flex items-center justify-center text-9xl border-4 border-white shadow-inner">
                  🏪
                </div>
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
                  <div className="text-7xl font-bold text-yellow-600">{rating}</div>
                  <div>
                    <div className="flex text-4xl text-yellow-500">★★★★☆</div>
                    <p className="text-gray-600 mt-2">{reviewCount} reseñas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6">Estadísticas</h3>
                <div className="space-y-6">
                  <div className="flex justify-between"><span>Gigs publicados</span><span className="font-bold">{totalGigs}</span></div>
                  <div className="flex justify-between"><span>Ingresos totales</span><span className="font-bold text-green-600">${totalEarnings}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <GrokAssistant />
      </div>
    </div>
  );
}
