"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { put } from '@vercel/blob';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Sparkles, UserPlus, Copy, MapPin, Phone } from "lucide-react";
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
      alert("✅ Foto de perfil actualizada");
    } catch (err) {
      alert("Error al subir foto");
    } finally {
      setUploading(false);
    }
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
      alert("✅ Perfil guardado correctamente");
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

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("✅ Enlace de perfil copiado");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={copyProfileLink}>
              <Copy size={18} className="mr-2" /> Compartir Perfil
            </Button>
            <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
              {isEditing ? "💾 Guardar" : "✏️ Editar"}
            </Button>
          </div>
        </div>

        <Card className="shadow-2xl overflow-hidden">
          <div className="h-56 bg-gradient-to-r from-orange-500 to-amber-500 relative">
            <div className="absolute -bottom-16 left-8">
              <label className="cursor-pointer group">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl text-gray-300">👤</div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow group-hover:scale-110 transition">
                  <Camera size={20} />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>

          <CardContent className="pt-20 px-8 pb-10">
            <div className="flex justify-between items-start">
              <div>
                <input name="name" value={formData.name} onChange={handleChange} disabled={!isEditing}
                  className="text-4xl font-bold bg-transparent border-b focus:outline-none w-full" placeholder="Tu nombre" />
                <input name="tagline" value={formData.tagline} onChange={handleChange} disabled={!isEditing}
                  className="text-orange-600 text-xl mt-1 bg-transparent border-b focus:outline-none w-full" placeholder="Tu frase destacada" />
                <p className="text-sm text-gray-500 capitalize mt-3">{userRole}</p>
              </div>
            </div>

            <div className="mt-10">
              <label className="block text-sm font-medium mb-3">Sobre mí</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} rows={5}
                className="w-full border rounded-3xl p-6 focus:border-orange-500" placeholder="Cuéntales a los clientes quién eres..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} disabled={!isEditing}
                  className="w-full border rounded-2xl p-4" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                  className="w-full border rounded-2xl p-4" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ciudad</label>
                <input name="city" value={formData.city} onChange={handleChange} disabled={!isEditing}
                  className="w-full border rounded-2xl p-4" />
              </div>
            </div>

            {isBuyer && (
              <Button onClick={handleBecomeSeller} className="w-full mt-12 py-8 text-lg bg-gradient-to-r from-emerald-600 to-teal-600">
                <UserPlus className="mr-3" size={24} />
                Quiero ser Vendedor en OigaUsted
              </Button>
            )}
          </CardContent>
        </Card>

        <GrokAssistant />
      </div>
    </div>
  );
}
