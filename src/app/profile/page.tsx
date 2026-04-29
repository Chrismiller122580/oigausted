"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { put } from '@vercel/blob';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Sparkles, UserPlus } from "lucide-react";
import GrokAssistant from "@/components/common/GrokAssistant";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
      const blob = await put(`avatars/${Date.now()}-${file.name}`, file, { access: 'public', addRandomSuffix: true });
      setFormData({ ...formData, imageUrl: blob.url });
      alert("✅ Foto actualizada");
    } catch (err) {
      alert("Error al subir foto");
    } finally {
      setUploading(false);
    }
  };

  const generateWithGrok = async () => {
    if (!formData.name) return alert("Escribe tu nombre primero");
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Bio profesional para ${formData.name}` })
      });
      const data = await res.json();
      if (data.bio) setFormData({ ...formData, bio: data.bio });
    } catch (e) {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      await update();
      setIsEditing(false);
      alert("✅ Perfil guardado");
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const userRole = (session?.user as any)?.role || 'buyer';
  const isBuyer = userRole === 'buyer';

  const handleBecomeSeller = async () => {
    if (!confirm("¿Quieres convertirte en vendedor y empezar a publicar gigs?")) return;
    try {
      const res = await fetch('/api/user/become-seller', { method: 'POST' });
      if (res.ok) {
        await update();
        alert("🚀 ¡Ahora eres vendedor!");
        window.location.reload();
      }
    } catch (err) {
      alert("Error al cambiar rol");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <h1 className="text-4xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-gray-600 mb-8">Gestiona tu información {isBuyer ? "como comprador" : "como vendedor"}</p>

        <Card className="shadow-2xl overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-orange-500 to-amber-500 relative">
            <div className="absolute -bottom-16 left-8">
              <label className="cursor-pointer">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center text-7xl">👤</div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>

          <CardContent className="pt-20 px-8 pb-10">
            <div className="flex justify-end mb-6">
              <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                {isEditing ? "💾 Guardar" : "✏️ Editar"}
              </Button>
            </div>

            <input name="name" value={formData.name} onChange={handleChange} disabled={!isEditing}
              className="text-4xl font-bold w-full bg-transparent border-b mb-1" placeholder="Tu nombre" />

            <input name="tagline" value={formData.tagline} onChange={handleChange} disabled={!isEditing}
              className="text-orange-600 w-full bg-transparent border-b mb-8" placeholder="Tu frase destacada" />

            <div className="mb-8">
              <div className="flex justify-between mb-3">
                <label className="font-medium">Sobre mí</label>
                <button onClick={generateWithGrok} className="text-orange-600 hover:underline flex items-center gap-1 text-sm">
                  <Sparkles size={16} /> Grok AI
                </button>
              </div>
              <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} rows={4}
                className="w-full border rounded-2xl p-5" placeholder="Cuéntales quién eres..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label>WhatsApp</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} disabled={!isEditing}
                  className="w-full border rounded-2xl p-4 mt-2" />
              </div>
              <div>
                <label>Ciudad</label>
                <input name="city" value={formData.city} onChange={handleChange} disabled={!isEditing}
                  className="w-full border rounded-2xl p-4 mt-2" />
              </div>
            </div>

            {isBuyer && (
              <Button onClick={handleBecomeSeller} className="w-full mt-10 py-7 text-lg bg-gradient-to-r from-green-600 to-emerald-600">
                <UserPlus className="mr-3" /> Quiero ser Vendedor en OigaUsted
              </Button>
            )}
          </CardContent>
        </Card>

        <GrokAssistant />
      </div>
    </div>
  );
}
