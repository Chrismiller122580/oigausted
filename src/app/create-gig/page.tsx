'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { gigCategories } from '@/lib/gig-categories';
import { categories, categoryEmojis } from '@/lib/categories';
import { Sparkles } from 'lucide-react';

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
  const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null);

  useEffect(() => {
    if (formData.category) {
      const catData = gigCategories.find(c => c.name === formData.category);
      setSelectedCategoryData(catData || null);
    }
  }, [formData.category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: value }
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  };

  const generateDescription = async () => {
    if (!formData.title) return setError("Escribe un título primero");
    setGenerating(true);
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Descripción profesional para gig: ${formData.title}` })
      });
      const data = await res.json();
      if (data.reply || data.description) {
        setFormData(prev => ({ ...prev, description: data.reply || data.description }));
      }
    } catch (err) {
      setError("No se pudo generar descripción");
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
      if (!resUpload.ok) throw new Error(uploadData.error || 'Error subiendo imagen');

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
      if (!res.ok) throw new Error(data.error || data.message || 'Error al crear gig');

      setSuccess('¡Gig creado exitosamente!');
      setTimeout(() => router.push('/gigs'), 1200);
    } catch (err: any) {
      setError(err.message || 'Algo salió mal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/seller" className="text-orange-600 hover:underline mb-6 inline-block">← Volver al Dashboard</Link>
      <h1 className="text-4xl font-bold mb-8">Crear Nuevo Gig</h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border space-y-8">
        <div>
          <label className="block text-sm font-medium mb-2">Título</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full px-4 py-3 border rounded-2xl" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="block text-sm font-medium">Descripción</label>
            <button type="button" onClick={generateDescription} disabled={generating} className="text-orange-600 text-sm flex items-center gap-1">
              <Sparkles size={16} /> Grok
            </button>
          </div>
          <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={6} className="w-full px-4 py-3 border rounded-3xl" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Categoría</label>
          <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-4 py-3 border rounded-2xl">
            <option value="">Selecciona categoría</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Precio (COP)</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-4 py-3 border rounded-2xl" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tiempo de entrega (días)</label>
            <input type="number" name="completionTime" value={formData.completionTime} onChange={handleInputChange} required className="w-full px-4 py-3 border rounded-2xl" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Imagen</label>
          <label htmlFor="image-upload" className="cursor-pointer bg-orange-600 text-white px-8 py-4 rounded-2xl inline-block">
            📸 Seleccionar imagen
          </label>
          <input type="file" accept="image/*" onChange={handleImageChange} id="image-upload" className="hidden" />
          <p className="mt-2 text-sm">{image ? image.name : 'No seleccionada'}</p>
        </div>

        {error && <p className="text-red-600 bg-red-50 p-4 rounded-2xl">{error}</p>}
        {success && <p className="text-green-600 bg-green-50 p-4 rounded-2xl">{success}</p>}

        <button type="submit" disabled={loading || !image} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl text-lg">
          {loading ? 'Creando Gig...' : 'Publicar Gig'}
        </button>
      </form>
    </div>
  );
}
