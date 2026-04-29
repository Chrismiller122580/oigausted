"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { put } from '@vercel/blob';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Save, Sparkles } from "lucide-react";
import GrokAssistant from "@/components/common/GrokAssistant";

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
      const blob = await put(`avatars/${Date.now()}-${file.name}`, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      setFormData({ ...formData, imageUrl: blob.url });
      alert("✅ Foto de perfil actualizada");
    } catch (err) {
      alert("❌ Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const generateWithGrok = async () => {
    if (!formData.name) {
      alert("Escribe tu nombre primero");
      return;
    }
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Escribe una bio atractiva y profesional (máximo 180 caracteres) para un ${ (session?.user as any)?.role === 'seller' ? 'vendedor' : 'comprador'} colombiano. Nombre: ${formData.name}.`
        })
      });
      const data = await res.json();
      if (data.bio) {
        setFormData({ ...formData, bio: data.bio });
        alert("✨ Bio generada con Grok AI");
      }
    } catch (err) {
      alert("No se pudo generar la bio");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await update();
        setIsEditing(false);
        alert("🎉 Perfil actualizado correctamente");
      } else {
        alert("❌ Error al guardar");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const userRole = (session?.user as any)?.role || 'user';

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <h1 className="text-4xl font-bold mb-8">Mi Perfil</h1>

        <Card className="shadow-xl">
          <div className="h-40 bg-gradient-to-r from-orange-500 to-amber-500 relative">
            <div className="absolute -bottom-16 left-8">
              <label className="cursor-pointer group">
                <div className="relative w-32 h-32">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Perfil" className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-white flex items-center justify-center text-6xl">👤</div>
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-md group-hover:scale-110 transition">
                    <Camera size={20} />
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
          </div>

          <CardContent className="pt-20 pb-10 px-8">
            <div className="flex justify-end mb-6">
              <Button onClick={() => isEditing ? handleSave() : setIsEditing(!isEditing)}>
                {isEditing ? "💾 Guardar" : "✏️ Editar Perfil"}
              </Button>
            </div>

            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              className="text-4xl font-bold w-full bg-transparent border-b focus:outline-none mb-2"
              placeholder="Tu nombre"
            />

            <input
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              disabled={!isEditing}
              className="text-orange-600 text-lg w-full bg-transparent border-b focus:outline-none mb-8"
              placeholder="Tu frase destacada"
            />

            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="font-medium">Sobre mí</label>
                <button onClick={generateWithGrok} className="text-orange-600 hover:underline text-sm flex items-center gap-1">
                  <Sparkles size={16} /> Grok AI
                </button>
              </div>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows={5}
                className="w-full border rounded-2xl p-5 focus:border-orange-500"
                placeholder="Cuéntales a los clientes quién eres..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} disabled={!isEditing}
                  className="w-full border rounded-2xl p-4" placeholder="+57 300 123 4567" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing}
                  className="w-full border rounded-2xl p-4" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ciudad</label>
                <input name="city" value={formData.city} onChange={handleChange} disabled={!isEditing}
                  className="w-full border rounded-2xl p-4" placeholder="Bucaramanga" />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              {isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <GrokAssistant />
      </div>
    </div>
  );
}
