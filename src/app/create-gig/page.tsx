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

  const [dynamicFields, setDynamicFields] = useState<any[]>([]);

  useEffect(() => {
    const cat = formData.category;
    let fields: any[] = [];

    if (cat === 'Limpieza de Hogar y Oficinas') {
      fields = [
        { key: 'rooms', label: 'Número de habitaciones', type: 'number', placeholder: 'Ej: 3' },
        { key: 'bathrooms', label: 'Número de baños', type: 'number', placeholder: 'Ej: 2' },
        { key: 'deepClean', label: '¿Limpieza profunda?', type: 'checkbox' },
        { key: 'pets', label: '¿Hay mascotas?', type: 'checkbox' },
      ];
    } else if (cat === 'Transporte y Mudanzas' || cat.includes('Delivery') || cat.includes('Mensajería')) {
      fields = [
        { key: 'pickupAddress', label: 'Dirección de recogida', type: 'text' },
        { key: 'deliveryAddress', label: 'Dirección de entrega', type: 'text' },
        { key: 'packageSize', label: 'Tamaño del paquete', type: 'select', options: ['Pequeño', 'Mediano', 'Grande'] },
        { key: 'urgent', label: '¿Entrega urgente?', type: 'checkbox' },
      ];
    } else if (cat === 'Reparaciones y Mantenimiento del Hogar') {
      fields = [
        { key: 'problemType', label: 'Tipo de reparación', type: 'select', options: ['Eléctrica', 'Plomería', 'Pintura', 'Carpintería', 'Otra'] },
        { key: 'urgency', label: 'Urgencia', type: 'select', options: ['Hoy', 'Esta semana', 'Normal'] },
      ];
    }

    setDynamicFields(fields);
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
    if (e.target.files?.[0]) setImage(e.target.files[0]);
  };

  const generateDescription = async () => {
    if (!formData.title || !formData.category) return setError("Título y categoría son obligatorios");
    setGenerating(true);
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Descripción profesional y atractiva en español colombiano para: ${formData.category} - ${formData.title}` })
      });
      const data = await res.json();
      if (data.reply) setFormData(prev => ({ ...prev, description: data.reply }));
    } catch {
      setError("No se pudo generar la descripción");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return setError('Selecciona una imagen');
    if (!formData.price) return setError('Ingresa un precio');

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
          ...formData,
          price: parseFloat(formData.price),
          imageUrl: uploadData.url,
        }),
      });

      if (!res.ok) throw new Error('Error al publicar');
      setSuccess('¡Gig publicado exitosamente!');
      setTimeout(() => router.push('/gigs'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/seller" className="text-orange-600 hover:underline mb-8 inline-flex items-center gap-2">← Volver</Link>

      <h1 className="text-5xl font-bold mb-2">Publica tu Servicio</h1>
      <p className="text-xl text-gray-600 mb-10">Llena los datos y publica en minutos</p>

      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl border space-y-10">
        {/* Title, Description, Category, Price - same as before */}
        <div>
          <label className="block text-sm font-medium mb-2">Título</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-lg" placeholder="Ej: Limpieza profunda..." />
        </div>

        <div>
          <div className="flex justify-between mb-3">
            <label className="block text-sm font-medium">Descripción</label>
            <button type="button" onClick={generateDescription} disabled={generating} className="text-orange-600 flex items-center gap-1 text-sm">
              <Sparkles size={18} /> Generar con Grok
            </button>
          </div>
          <textarea name="description" value={formData.description} onChange={handleInputChange} rows={5} className="w-full px-5 py-4 border rounded-3xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Categoría</label>
            <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl">
              <option value="">Selecciona una categoría</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {categoryEmojis[cat] || '•'} {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Precio (COP)</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-lg" placeholder="85000" />
          </div>
        </div>

        {/* Dynamic Fields */}
        {dynamicFields.length > 0 && (
          <div className="border-t pt-8">
            <h3 className="font-semibold text-lg mb-6">Detalles específicos del servicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dynamicFields.map((field, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium mb-2">{field.label}</label>
                  {field.type === 'number' && (
                    <input type="number" onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} className="w-full px-5 py-4 border rounded-2xl" placeholder={field.placeholder} />
                  )}
                  {field.type === 'text' && (
                    <input type="text" onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} className="w-full px-5 py-4 border rounded-2xl" placeholder={field.placeholder} />
                  )}
                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" onChange={(e) => handleCustomFieldChange(field.key, e.target.checked)} className="w-5 h-5 accent-orange-600" />
                      <span>{field.label}</span>
                    </label>
                  )}
                  {field.type === 'select' && field.options && (
                    <select onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} className="w-full px-5 py-4 border rounded-2xl">
                      <option value="">Selecciona...</option>
                      {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-3">Imagen del servicio</label>
          <label htmlFor="image-upload" className="cursor-pointer border-2 border-dashed border-orange-300 hover:border-orange-600 rounded-3xl p-12 flex flex-col items-center">
            <ImageIcon className="w-12 h-12 text-orange-500 mb-4" />
            <span className="font-medium">Seleccionar imagen</span>
          </label>
          <input type="file" id="image-upload" onChange={handleImageChange} className="hidden" accept="image/*" />
          {image && <p className="mt-3 text-green-600">✓ {image.name}</p>}
        </div>

        {error && <p className="text-red-600 bg-red-50 p-4 rounded-2xl">{error}</p>}
        {success && <p className="text-green-600 bg-green-50 p-4 rounded-2xl">{success}</p>}

        <button type="submit" disabled={loading || !image || !formData.price} className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition">
          {loading ? 'Publicando Gig...' : 'Publicar Gig'}
        </button>
      </form>
    </div>
  );
}
