"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { put } from '@vercel/blob';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Sparkles, UserPlus, Copy, Share2, MapPin, Phone, Award } from "lucide-react";
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
        tagline: user.tagline || "Aquí para conectar y crecer",
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
      alert("🎉 Perfil actualizado");
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("✅ Enlace copiado");
  };

  const userRole = (session?.user as any)?.role || 'buyer';
  const isBuyer = userRole === 'buyer';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={copyLink}>
              <Share2 size={18} className="mr-2" /> Compartir Perfil
            </Button>
            <Button onClick={() => isEditing ? handleSave() : setIsEditing(!isEditing)}>
              {isEditing ? "💾 Guardar" : "✏️ Editar Perfil"}
            </Button>
          </div>
        </div>

        {/* Hero Profile Card */}
        <Card className="shadow-2xl overflow-hidden mb-10">
          <div className="h-64 bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 relative">
            <div className="absolute -bottom-16 left-10">
              <label className="cursor-pointer group">
                <div className="w-36 h-36 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-8xl text-gray-300">👤</div>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 bg-white p-3 rounded-full shadow-md group-hover:scale-110 transition">
                  <Camera size={22} />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>

          <CardContent className="pt-20 px-10 pb-10">
            <input name="name" value={formData.name} onChange={handleChange} disabled={!isEditing}
              className="text-5xl font-bold bg-transparent border-b w-full focus:outline-none" placeholder="Tu nombre" />

            <input name="tagline" value={formData.tagline} onChange={handleChange} disabled={!isEditing}
              className="text-xl text-orange-600 mt-3 bg-transparent border-b w-full focus:outline-none" placeholder="Tu frase destacada" />

            <p className="text-sm uppercase tracking-widest text-gray-500 mt-4">{userRole}</p>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="mb-8">
          <CardContent className="p-10">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-semibold">Sobre mí</h2>
              <button onClick={() => {}} className="text-orange-600 hover:underline flex items-center gap-2 text-sm">
                <Sparkles size={18} /> Generar con Grok
              </button>
            </div>
            <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} rows={6}
              className="w-full border rounded-3xl p-6 focus:border-orange-500" placeholder="Cuéntales quién eres y qué te apasiona..." />
          </CardContent>
        </Card>

        {/* Contact & Links */}
        <Card>
          <CardContent className="p-10">
            <h2 className="text-2xl font-semibold mb-8">Cómo contactarme</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-sm font-medium">WhatsApp</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} disabled={!isEditing}
                  className="w-full mt-2 border rounded-2xl p-5 text-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                  className="w-full mt-2 border rounded-2xl p-5 text-lg" />
              </div>
              <div>
                <label className="text-sm font-medium">Ciudad</label>
                <input name="city" value={formData.city} onChange={handleChange} disabled={!isEditing}
                  className="w-full mt-2 border rounded-2xl p-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isBuyer && (
          <Button onClick={() => {}} className="w-full mt-10 py-8 text-xl bg-gradient-to-r from-emerald-600 to-teal-600">
            🚀 Quiero convertirme en Vendedor
          </Button>
        )}

        <GrokAssistant />
      </div>
    </div>
  );
}
