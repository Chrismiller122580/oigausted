'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { gigCategories } from '@/lib/gig-categories';
import { categories, categoryEmojis } from '@/lib/categories';

export default function CreateGigPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
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

  // Redirect if not seller
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || (session.user as any).role !== "seller") {
      router.push('/seller');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (formData.category) {
      const catData = gigCategories.find(c => c.name === formData.category);
      setSelectedCategoryData(catData || null);
    } else {
      setSelectedCategoryData(null);
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
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('Por favor selecciona una imagen principal');
      return;
    }
    if (!session?.user) {
      setError('Debes estar logueado como vendedor');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', image);

      const resUpload = await fetch('/api/upload', { 
        method: 'POST', 
        body: formDataUpload 
      });

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
      if (!res.ok) throw new Error(data.error || 'Error al crear el gig');

      setSuccess('¡Gig creado exitosamente! Redirigiendo...');
      setTimeout(() => router.push('/gigs'), 1500);
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
          <label className="block text-sm font-medium mb-2">Título del gig</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} required 
                 className="w-full px-4 py-3 border rounded-2xl focus:border-orange-500" placeholder="Ej: Limpieza profunda de hogar" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Categoría</label>
          <select name="category" value={formData.category} onChange={handleInputChange} required 
                  className="w-full px-4 py-3 border rounded-2xl focus:border-orange-500">
            <option value="">Selecciona una categoría</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {categoryEmojis[cat] || ''} {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Descripción</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={6}
                    className="w-full px-4 py-3 border rounded-3xl focus:border-orange-500" placeholder="Describe tu servicio..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Precio (COP)</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required 
                   className="w-full px-4 py-3 border rounded-2xl focus:border-orange-500" placeholder="150000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tiempo de entrega (días)</label>
            <input type="number" name="completionTime" value={formData.completionTime} onChange={handleInputChange} required 
                   className="w-full px-4 py-3 border rounded-2xl focus:border-orange-500" />
          </div>
        </div>

        {selectedCategoryData && (
          <div className="border-t pt-8">
            <h3 className="font-semibold mb-4">Opciones específicas para {selectedCategoryData.name}</h3>
            {selectedCategoryData.fields?.map((field: any) => (
              <div key={field.key} className="mb-6">
                <label className="block text-sm font-medium mb-2">{field.label}</label>
                {field.type === 'number' && (
                  <input type="number" value={formData.customFields[field.key] || ''} 
                         onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} 
                         className="w-full px-4 py-3 border rounded-2xl" />
                )}
                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!formData.customFields[field.key]} 
                           onChange={(e) => handleCustomFieldChange(field.key, e.target.checked)} />
                    {field.label}
                  </label>
                )}
                {field.type === 'select' && (
                  <select value={formData.customFields[field.key] || ''} 
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} 
                          className="w-full px-4 py-3 border rounded-2xl">
                    <option value="">Selecciona...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3">Imagen principal del servicio</label>
          <div className="flex items-center gap-4">
            <label htmlFor="image-upload" className="cursor-pointer bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-2xl font-medium transition">
              📸 Seleccionar imagen
            </label>
            <input type="file" accept="image/*" onChange={handleImageChange} id="image-upload" className="hidden" />
            <span className="text-sm text-zinc-500">{image ? image.name : 'Ninguna imagen seleccionada'}</span>
          </div>
        </div>

        {error && <p className="text-red-600 bg-red-50 p-4 rounded-2xl">{error}</p>}
        {success && <p className="text-green-600 bg-green-50 p-4 rounded-2xl">{success}</p>}

        <button type="submit" disabled={loading || !image} 
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl text-lg transition">
          {loading ? 'Publicando Gig...' : 'Publicar Gig'}
        </button>
      </form>
    </div>
  );
}
