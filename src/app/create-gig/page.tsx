'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { categories, categoryEmojis } from '@/lib/categories';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

export default function CreateGigPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    completionTime: '3',
    customFields: {} as Record<string, any>,
  });

  const [image, setImage] = useState<File | null>(null);
  const [isLimpieza, setIsLimpieza] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'category') {
      setIsLimpieza(e.target.value === 'Limpieza de Hogar y Oficinas');
    }
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: value }
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setImage(e.target.files[0]);
  };

  const generateDescription = async () => {
    if (!formData.title) return setError("Escribe un título primero");
    setGenerating(true);
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Escribe una descripción atractiva y profesional para un servicio de ${formData.category}: ${formData.title}.` 
        })
      });
      const data = await res.json();
      if (data.reply) setFormData(prev => ({ ...prev, description: data.reply }));
    } catch (err) {
      setError("No se pudo generar la descripción");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return setError('Selecciona una imagen');

    setLoading(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', image);

      const resUpload = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const uploadData = await resUpload.json();
      if (!resUpload.ok) throw new Error(uploadData.error);

      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price) || 0,
          category: formData.category,
          imageUrl: uploadData.url,
          completionTime: formData.completionTime,
          fields: formData.customFields,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('¡Gig publicado con éxito!');
      setTimeout(() => router.push('/gigs'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/seller" className="text-orange-600 hover:underline mb-8 inline-flex items-center gap-2">← Volver al Dashboard del Vendedor</Link>

      <h1 className="text-5xl font-bold mb-2">Publica tu Servicio</h1>
      <p className="text-xl text-gray-600 mb-10">Elige categoría y llena los detalles inteligentes</p>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl border space-y-10">
        <div>
          <label className="block text-sm font-medium mb-2">Título del Gig</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-lg" placeholder="Ej: Limpieza profunda de apartamentos" />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium">Descripción</label>
            <button type="button" onClick={generateDescription} disabled={generating || !formData.title} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-medium">
              <Sparkles size={18} /> {generating ? "Grok pensando..." : "Generar con Grok"}
            </button>
          </div>
          <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={6} className="w-full px-5 py-4 border rounded-3xl" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Categoría</label>
          <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-base">
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {categoryEmojis[cat] || '•'} {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields for Limpieza - Hardcoded for testing */}
        {isLimpieza && (
          <div className="border-t pt-8">
            <h3 className="font-semibold text-lg mb-6">Detalles específicos de Limpieza</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Número de habitaciones</label>
                <input type="number" onChange={(e) => handleCustomFieldChange('rooms', e.target.value)} className="w-full px-5 py-4 border rounded-2xl" placeholder="Ej: 3" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Número de baños</label>
                <input type="number" onChange={(e) => handleCustomFieldChange('bathrooms', e.target.value)} className="w-full px-5 py-4 border rounded-2xl" placeholder="Ej: 2" />
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" onChange={(e) => handleCustomFieldChange('deepClean', e.target.checked)} className="w-5 h-5 accent-orange-600" />
                  <span>¿Limpieza profunda?</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" onChange={(e) => handleCustomFieldChange('pets', e.target.checked)} className="w-5 h-5 accent-orange-600" />
                  <span>¿Hay mascotas?</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3">Imagen principal</label>
          <label htmlFor="image-upload" className="cursor-pointer border-2 border-dashed border-orange-300 hover:border-orange-600 rounded-3xl p-12 flex flex-col items-center">
            <ImageIcon className="w-12 h-12 text-orange-500 mb-4" />
            <span>Subir imagen</span>
          </label>
          <input type="file" id="image-upload" onChange={handleImageChange} className="hidden" accept="image/*" />
          {image && <p className="mt-3 text-green-600">✓ {image.name}</p>}
        </div>

        {error && <p className="text-red-600 bg-red-50 p-4 rounded-2xl">{error}</p>}
        {success && <p className="text-green-600 bg-green-50 p-4 rounded-2xl">{success}</p>}

        <button type="submit" disabled={loading || !image} className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl">
          {loading ? 'Publicando...' : 'Publicar Gig'}
        </button>
      </form>
    </div>
  );
}
