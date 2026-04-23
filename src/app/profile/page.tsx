"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { put } from '@vercel/blob';
import { toast } from '@/components/Toast';

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
      const blob = await put(`avatars/${Date.now()}-${file.name}`, file, {
        access: 'public',
        addRandomSuffix: true,
      });

      setFormData({ ...formData, imageUrl: blob.url });
      toast.success("Foto de perfil actualizada");
    } catch (err) {
      toast.error("Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const generateWithGrok = async () => {
    if (!formData.name) {
      toast.error("Primero escribe tu nombre");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Escribe una bio atractiva y profesional (máximo 180 caracteres) para un ${session?.user?.role === 'seller' ? 'vendedor' : 'comprador'} colombiano en OigaUsted, un marketplace de servicios entre colombianos. Nombre: ${formData.name}. Enfócate en confianza, calidad y cercanía. Responde solo con la bio.`
        })
      });
      const data = await res.json();
      if (data.bio) {
        setFormData({ ...formData, bio: data.bio });
        toast.success("Bio generada con Grok AI");
      }
    } catch (err) {
      toast.error("No se pudo generar la bio");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
        toast.success("Perfil actualizado correctamente");
      } else {
        toast.error("Error al guardar");
      }
    } catch (err) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeSeller = async () => {
    if (!confirm("¿Estás seguro de convertirte en vendedor?")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/become-seller', { method: 'POST' });
      if (res.ok) {
        await update();
        toast.success("¡Ahora eres vendedor! Redirigiendo...");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      toast.error("Error al cambiar rol");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando perfil...</div>;

  const isBuyer = (session.user as any)?.role !== 'seller';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          <label className="cursor-pointer inline-block relative">
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-orange-500">
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-7xl text-white">👤</div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            {uploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">Subiendo...</div>}
          </label>

          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="text-3xl font-bold text-center block w-full mt-4 bg-transparent border-b focus:outline-none"
            placeholder="Tu nombre"
            disabled={!isEditing}
          />

          <input
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
            className="text-lg text-orange-600 text-center block w-full mt-1 bg-transparent border-b focus:outline-none"
            placeholder="Tu tagline (ej: El mejor electricista de Bucaramanga)"
            disabled={!isEditing}
          />

          <p className="text-sm text-gray-500 mt-2 capitalize">{(session.user as any)?.role || 'Usuario'}</p>
        </div>

        {/* Bio */}
        <div className="mt-8 bg-white rounded-3xl shadow p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Sobre mí</h2>
            <button
              onClick={generateWithGrok}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-2xl text-sm font-medium flex items-center gap-2"
            >
              ✨ Generar con Grok AI
            </button>
          </div>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-orange-300"
            placeholder="Cuéntanos sobre ti..."
            disabled={!isEditing}
          />
        </div>

        {/* Contact */}
        <div className="mt-8 bg-white rounded-3xl shadow p-8">
          <h2 className="text-2xl font-semibold mb-6">Contacto</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">WhatsApp (principal)</label>
              <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full border rounded-2xl p-4" placeholder="300 123 4567" disabled={!isEditing} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-2xl p-4" disabled={!isEditing} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ciudad</label>
                <input name="city" value={formData.city} onChange={handleChange} className="w-full border rounded-2xl p-4" placeholder="Bucaramanga" disabled={!isEditing} />
              </div>
            </div>
          </div>
        </div>

        {/* Become Seller Button */}
        {isBuyer && (
          <button
            onClick={handleBecomeSeller}
            disabled={loading}
            className="mt-8 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-5 rounded-3xl text-xl font-semibold shadow-lg hover:shadow-xl transition"
          >
            🚀 Quiero ser vendedor en OigaUsted
          </button>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex gap-4">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-300 rounded-3xl font-medium">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-4 bg-orange-600 text-white rounded-3xl font-medium">Guardar cambios</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex-1 py-4 bg-gray-900 text-white rounded-3xl font-medium">Editar perfil</button>
          )}
        </div>
      </div>
    </div>
  );
}
