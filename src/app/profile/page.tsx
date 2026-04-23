"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { put } from '@vercel/blob';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setLoading(true);
    try {
      const userRole = (session?.user as any)?.role || 'user';
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Escribe una bio atractiva y profesional (máximo 180 caracteres) para un ${userRole === 'seller' ? 'vendedor' : 'comprador'} colombiano en OigaUsted. Nombre: ${formData.name}. Enfócate en confianza, calidad y cercanía. Responde solo con la bio.`
        })
      });
      const data = await res.json();
      if (data.bio) {
        setFormData({ ...formData, bio: data.bio });
        alert("✨ Bio generada con Grok AI");
      }
    } catch (err) {
      alert("No se pudo generar la bio");
    } finally {
      setLoading(false);
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

  const handleBecomeSeller = async () => {
    if (!confirm("¿Estás seguro de convertirte en vendedor?")) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/become-seller', { method: 'POST' });
      if (res.ok) {
        await update();
        alert("🚀 ¡Ahora eres vendedor! Recargando...");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      alert("Error al cambiar rol");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando perfil...</div>;

  const userRole = (session.user as any)?.role || 'user';
  const isBuyer = userRole !== 'seller';

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Hero Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
          
          <div className="px-6 -mt-14 pb-8 text-center relative">
            <label className="cursor-pointer group inline-block">
              <div className="relative w-32 h-32 mx-auto">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-7xl text-white">👤</div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-white rounded-full p-3 shadow-md group-hover:scale-110 transition-all">
                  📷
                </div>
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>

            {uploading && <p className="text-orange-600 text-sm mt-2">Subiendo foto...</p>}

            <input name="name" value={formData.name} onChange={handleChange}
              className="text-3xl font-bold mt-4 block w-full text-center bg-transparent border-b focus:outline-none" 
              placeholder="Tu nombre completo" disabled={!isEditing} />

            <input name="tagline" value={formData.tagline} onChange={handleChange}
              className="text-lg text-orange-600 mt-1 block w-full text-center bg-transparent border-b focus:outline-none" 
              placeholder="Tu frase destacada" disabled={!isEditing} />

            <p className="text-sm text-gray-500 mt-3 capitalize font-medium">{userRole}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-8 bg-white rounded-3xl shadow p-8">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-semibold">Sobre mí</h2>
            <button onClick={generateWithGrok} disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-2xl text-sm font-medium flex items-center gap-2">
              {loading ? "✨ Generando..." : "✨ Grok AI"}
            </button>
          </div>
          <textarea name="bio" value={formData.bio} onChange={handleChange} rows={5}
            className="w-full border border-gray-200 rounded-2xl p-5 focus:outline-none focus:border-orange-400 resize-y min-h-[140px]"
            placeholder="Cuéntales a los clientes quién eres..." disabled={!isEditing} />
        </div>

        {/* Contact */}
        <div className="mt-8 bg-white rounded-3xl shadow p-8">
          <h2 className="text-2xl font-semibold mb-6">Información de Contacto</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp (principal)</label>
              <input name="whatsapp" value={formData.whatsapp} onChange={handleChange} 
                className="w-full border rounded-2xl p-4 text-lg" placeholder="300 123 4567" disabled={!isEditing} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono adicional</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-2xl p-4" disabled={!isEditing} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ciudad / Departamento</label>
                <input name="city" value={formData.city} onChange={handleChange} className="w-full border rounded-2xl p-4" placeholder="Bucaramanga, Santander" disabled={!isEditing} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Instagram</label>
                <input name="instagram" value={formData.instagram} onChange={handleChange} className="w-full border rounded-2xl p-4" placeholder="@tunombre" disabled={!isEditing} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Facebook</label>
                <input name="facebook" value={formData.facebook} onChange={handleChange} className="w-full border rounded-2xl p-4" placeholder="facebook.com/tunombre" disabled={!isEditing} />
              </div>
            </div>
          </div>
        </div>

        {isBuyer && (
          <button onClick={handleBecomeSeller} disabled={loading}
            className="mt-10 w-full py-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl text-xl font-bold shadow-lg hover:shadow-2xl transition flex items-center justify-center gap-3">
            🚀 Quiero ser vendedor en OigaUsted
          </button>
        )}

        <div className="mt-10 flex gap-4 px-1">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-300 rounded-3xl font-semibold hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-orange-600 text-white rounded-3xl font-semibold hover:bg-orange-700 flex items-center justify-center gap-2">
                {saving ? "Guardando..." : "💾 Guardar cambios"}
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex-1 py-4 bg-gray-900 text-white rounded-3xl font-semibold hover:bg-black">✏️ Editar perfil</button>
          )}
        </div>
      </div>
    </div>
  );
}
