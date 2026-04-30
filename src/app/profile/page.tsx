'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Sparkles, Share2, MapPin, Phone, Award } from "lucide-react";

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
      if (data.url) setFormData({ ...formData, imageUrl: data.url });
    } catch (err) {
      alert("Error subiendo foto");
    } finally {
      setUploading(false);
    }
  };

  const generateBio = async () => {
    if (!formData.name) return alert("Escribe tu nombre primero");
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Escribe una bio profesional y atractiva (máximo 180 caracteres) para ${formData.name} en OigaUsted.` 
        })
      });
      const data = await res.json();
      if (data.reply || data.description) {
        setFormData(prev => ({ ...prev, bio: data.reply || data.description }));
      }
    } catch (err) {
      alert("No se pudo generar bio");
    }
  };

  const copyProfileLink = () => {
    const userId = (session?.user as any)?.id || '';
    const link = `${window.location.origin}/profile/${userId}`;
    navigator.clipboard.writeText(link);
    alert("✅ Enlace copiado: " + link);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      await update();
      setIsEditing(false);
      alert("✅ Perfil guardado correctamente");
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const isSeller = (session?.user as any)?.role === 'seller';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-bold">Mi Perfil</h1>
          <div className="flex gap-3">
            <Button onClick={copyProfileLink} variant="outline">
              <Share2 size={18} className="mr-2" /> Compartir Perfil
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "default" : "outline"}>
              {isEditing ? "Cancelar" : "Editar Perfil"}
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden shadow-2xl">
          <div className="h-64 bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 relative">
            <div className="absolute -bottom-16 left-10">
              <label className="cursor-pointer">
                <div className="w-32 h-32 bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl relative group">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl bg-gray-100">👤</div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Camera className="text-white" size={32} />
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>

          <CardContent className="pt-20 px-10 pb-12">
            {isEditing ? (
              <div className="space-y-8">
                <Input name="name" value={formData.name} onChange={handleChange} className="text-4xl font-bold" placeholder="Tu nombre" />
                <Input name="tagline" value={formData.tagline} onChange={handleChange} placeholder="Tagline o profesión" />
                <div className="flex justify-between items-center">
                  <label className="font-medium">Biografía</label>
                  <button onClick={generateBio} className="text-orange-600 flex items-center gap-1 text-sm">
                    <Sparkles size={16} /> Generar con Grok
                  </button>
                </div>
                <Textarea name="bio" value={formData.bio} onChange={handleChange} rows={5} placeholder="Cuéntanos sobre ti..." />

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
              <div className="space-y-10">
                <div>
                  <h2 className="text-5xl font-bold">{formData.name || "Tu Nombre"}</h2>
                  <p className="text-2xl text-orange-600 mt-2">{formData.tagline}</p>
                </div>

                <p className="text-lg text-gray-700 leading-relaxed">{formData.bio || "Sin biografía aún."}</p>

                <div className="flex flex-wrap gap-x-10 gap-y-4 text-lg">
                  {formData.city && <div className="flex items-center gap-3"><MapPin /> {formData.city}</div>}
                  {formData.phone && <div className="flex items-center gap-3"><Phone /> {formData.phone}</div>}
                  {formData.whatsapp && <div className="flex items-center gap-3">💬 {formData.whatsapp}</div>}
                </div>

                {isSeller && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-8 rounded-3xl flex items-center gap-6">
                    <Award className="w-14 h-14 text-orange-600" />
                    <div>
                      <p className="font-semibold text-xl">Vendedor Verificado</p>
                      <p className="text-gray-600">Parte de la comunidad confiable de OigaUsted</p>
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
