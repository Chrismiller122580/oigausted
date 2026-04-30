'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { gigCategories } from '@/lib/gig-categories';
import { categories, categoryEmojis } from '@/lib/categories';
import { Sparkles, Clock, Image as ImageIcon } from 'lucide-react';

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
        body: JSON.stringify({ 
          prompt: `Escribe una descripción atractiva, profesional y convincente en español colombiano para este gig: ${formData.title}. Máximo 280 caracteres.` 
        })
      });
      const data = await res.json();
      if (data.reply || data.description) {
        setFormData(prev => ({ ...prev, description: data.reply || data.description }));
      }
    } catch (err) {
      setError("No se pudo generar la descripción con Grok");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return setError('Por favor selecciona una imagen');

    const userId = (session?.user as any)?.id;
    if (!userId) return setError('Debes estar logueado como vendedor');

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
      if (!res.ok) throw new Error(data.error || 'Error al crear el gig');

      setSuccess('¡Gig publicado con éxito!');
      setTimeout(() => router.push('/gigs'), 1500);
    } catch (err: any) {
      setError(err.message || 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/seller" className="text-orange-600 hover:underline mb-8 inline-flex items-center gap-2">
        ← Volver al Dashboard del Vendedor
      </Link>

      <h1 className="text-5xl font-bold mb-2">Publica tu Servicio</h1>
      <p className="text-xl text-gray-600 mb-10">Conecta con clientes locales en Colombia</p>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl border shadow-sm space-y-10">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Título del Gig</label>
          <input 
            type="text" 
            name="title" 
            value={formData.title} 
            onChange={handleInputChange} 
            required 
            className="w-full px-5 py-4 border rounded-2xl text-lg" 
            placeholder="Ej: Limpieza profunda de apartamentos en Bucaramanga" 
          />
        </div>

        {/* Description with Grok */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium">Descripción del Servicio</label>
            <button 
              type="button" 
              onClick={generateDescription} 
              disabled={generating || !formData.title}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              <Sparkles size={18} /> {generating ? "Grok pensando..." : "Generar con Grok"}
            </button>
          </div>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleInputChange} 
            required 
            rows={6}
            className="w-full px-5 py-4 border rounded-3xl" 
            placeholder="Describe tu servicio de forma atractiva..." 
          />
        </div>

        {/* Category with Emojis */}
        <div>
          <label className="block text-sm font-medium mb-3">Categoría</label>
          <select 
            name="category" 
            value={formData.category} 
            onChange={handleInputChange} 
            required 
            className="w-full px-5 py-4 border rounded-2xl text-base"
          >
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {categoryEmojis[cat] || '•'} {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price & Delivery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium mb-2">Precio (en COP)</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-lg" placeholder="150000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tiempo de entrega</label>
            <div className="flex items-center gap-3 border rounded-2xl px-5 py-4">
              <Clock className="text-orange-600" />
              <input type="number" name="completionTime" value={formData.completionTime} onChange={handleInputChange} required className="flex-1 outline-none" />
              <span className="text-gray-500">días</span>
            </div>
          </div>
        </div>

        {/* Dynamic Fields */}
        {selectedCategoryData && selectedCategoryData.fields?.length > 0 && (
          <div className="border-t pt-8">
            <h3 className="font-semibold text-lg mb-6">Información adicional requerida</h3>
            {selectedCategoryData.fields.map((field: any) => (
              <div key={field.key} className="mb-6">
                <label className="block text-sm font-medium mb-2">{field.label}</label>
                {/* Render different input types based on field */}
                {field.type === 'number' && <input type="number" className="w-full px-5 py-4 border rounded-2xl" onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} />}
                {/* Add more field types as needed */}
              </div>
            ))}
          </div>
        )}

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-3">Foto principal del servicio</label>
          <label htmlFor="image-upload" className="cursor-pointer border-2 border-dashed border-orange-300 hover:border-orange-600 rounded-3xl p-12 flex flex-col items-center justify-center transition">
            <ImageIcon className="w-12 h-12 text-orange-500 mb-4" />
            <span className="font-medium">Haz clic para subir una imagen</span>
            <span className="text-sm text-gray-500 mt-1">Recomendado: 1200x800 px</span>
          </label>
          <input type="file" accept="image/*" onChange={handleImageChange} id="image-upload" className="hidden" />
          {image && <p className="mt-3 text-sm text-green-600">✓ {image.name}</p>}
        </div>

        {error && <p className="text-red-600 bg-red-50 p-4 rounded-2xl">{error}</p>}
        {success && <p className="text-green-600 bg-green-50 p-4 rounded-2xl">{success}</p>}

        <button 
          type="submit" 
          disabled={loading || !image} 
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition"
        >
          {loading ? 'Publicando tu Gig...' : 'Publicar Gig'}
        </button>
      </form>
    </div>
  );
}
