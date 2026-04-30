'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Sparkles, Share2, MapPin, Phone, Star, Award } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    bio: "",
    phone: "",
    whatsapp: "",
    city: "",
    instagram: "",
    facebook: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      setFormData({
        name: user.name || "",
        tagline: user.tagline || "",
        bio: user.bio || "",
        phone: user.phone || "",
        whatsapp: user.whatsapp || "",
        city: user.city || "",
        instagram: user.instagram || "",
        facebook: user.facebook || "",
        imageUrl: user.image || "",
      });
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await res.json();

      if (data.url) {
        setFormData({ ...formData, imageUrl: data.url });
        alert("✅ Foto actualizada");
      }
    } catch (err) {
      alert("❌ Error al subir foto");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await update();
        setIsEditing(false);
        alert("✅ Perfil actualizado correctamente");
      } else {
        alert("Error al guardar");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const copyProfileLink = () => {
    const link = `${window.location.origin}/profile/${session?.user?.id || ''}`;
    navigator.clipboard.writeText(link);
    alert("✅ Enlace copiado: " + link);
  };

  const isSeller = (session?.user as any)?.role === 'seller';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-bold">Mi Perfil</h1>
          <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "default" : "outline"}>
            {isEditing ? "Cancelar" : "Editar Perfil"}
          </Button>
        </div>

        <Card className="overflow-hidden shadow-xl">
          {/* Hero Banner */}
          <div className="h-64 bg-gradient-to-r from-orange-500 to-red-600 relative">
            <div className="absolute -bottom-16 left-8">
              <label className="cursor-pointer block">
                <div className="w-32 h-32 bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl relative">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-6xl">👤</div>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Camera className="text-white" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>

          <CardContent className="pt-20 pb-12 px-10">
            <div className="flex justify-end mb-6">
              <Button onClick={copyProfileLink} variant="outline" className="flex items-center gap-2">
                <Share2 size={18} /> Compartir Perfil
              </Button>
            </div>

            {isEditing ? (
              <div className="space-y-8">
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre completo" className="text-3xl font-bold" />
                <Input name="tagline" value={formData.tagline} onChange={handleChange} placeholder="Tagline o profesión (ej: Fotógrafo profesional en Bucaramanga)" />

                <Textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} placeholder="Cuéntanos sobre ti..." />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Teléfono" />
                  <Input name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp" />
                  <Input name="city" value={formData.city} onChange={handleChange} placeholder="Ciudad" />
                </div>

                <Button onClick={saveProfile} disabled={loading} className="w-full py-6 text-lg">
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-bold">{formData.name || "Tu Nombre"}</h2>
                  <p className="text-xl text-orange-600 mt-1">{formData.tagline}</p>
                </div>

                <p className="text-lg leading-relaxed text-gray-700">{formData.bio || "Aún no tienes biografía."}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  {formData.city && <div className="flex items-center gap-3"><MapPin /> {formData.city}</div>}
                  {formData.phone && <div className="flex items-center gap-3"><Phone /> {formData.phone}</div>}
                  {formData.whatsapp && <div className="flex items-center gap-3">📱 {formData.whatsapp}</div>}
                </div>

                {isSeller && (
                  <div className="bg-orange-50 border border-orange-200 rounded-3xl p-8 flex items-center gap-6">
                    <Award className="w-12 h-12 text-orange-600" />
                    <div>
                      <p className="font-semibold">Vendedor Verificado</p>
                      <p className="text-sm text-gray-600">Miembros de la comunidad confían en ti</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
