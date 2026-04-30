'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { categories, categoryEmojis } from '@/lib/categories';
import { Sparkles, Image as ImageIcon, Eye } from 'lucide-react';

export default function CreateGigPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

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
    } else if (cat.includes('Transporte') || cat.includes('Mudanzas') || cat.includes('Delivery') || cat.includes('Mensajería')) {
      fields = [
        { key: 'pickupAddress', label: 'Dirección de recogida', type: 'text' },
        { key: 'deliveryAddress', label: 'Dirección de entrega', type: 'text' },
        { key: 'packageSize', label: 'Tamaño', type: 'select', options: ['Pequeño', 'Mediano', 'Grande'] },
        { key: 'urgent', label: '¿Urgente?', type: 'checkbox' },
      ];
    } else if (cat === 'Reparaciones y Mantenimiento del Hogar') {
      fields = [
        { key: 'problemType', label: 'Tipo de reparación', type: 'select', options: ['Eléctrica', 'Plomería', 'Pintura', 'Carpintería', 'Otra'] },
        { key: 'urgency', label: 'Nivel de urgencia', type: 'select', options: ['Hoy mismo', 'Esta semana', 'Normal'] },
      ];
    } else if (cat === 'Clases Particulares' || cat.includes('Clases')) {
      fields = [
        { key: 'level', label: 'Nivel', type: 'select', options: ['Principiante', 'Intermedio', 'Avanzado'] },
        { key: 'duration', label: 'Duración por clase (horas)', type: 'number', placeholder: '1.5' },
        { key: 'online', label: '¿Clases virtuales?', type: 'checkbox' },
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
    if (!formData.title || !formData.category) return setError("Título y categoría requeridos");
    setGenerating(true);
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Escribe una descripción atractiva, profesional y cercana en español colombiano para un gig de ${formData.category}: ${formData.title}. Máximo 250 caracteres.` 
        })
      });
      const data = await res.json();
      if (data.reply) setFormData(prev => ({ ...prev, description: data.reply }));
    } catch {
      setError("Error con Grok");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !formData.price || !formData.title) {
      return setError('Faltan campos obligatorios (título, precio, imagen)');
    }

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
          category: formData.category,
          price: parseFloat(formData.price),
          completionTime: formData.completionTime,
          imageUrl: uploadData.url,
          fields: formData.customFields,
        }),
      });

      if (!res.ok) throw new Error('Error al crear el gig');
      setSuccess('¡Gig publicado con éxito! Redirigiendo...');
      setTimeout(() => router.push('/gigs'), 1800);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/seller" className="text-orange-600 hover:underline mb-8 inline-flex items-center gap-2">← Volver al Dashboard</Link>

      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-5xl font-bold">Publica tu Servicio</h1>
          <p className="text-xl text-gray-600">Llena los datos y publica en minutos</p>
        </div>
        <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 text-orange-600 hover:text-orange-700">
          <Eye size={20} /> {showPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Form Section */}
        <div className="lg:col-span-3 bg-white p-10 rounded-3xl border space-y-10">
          {/* Title, Description, Category, Price... (same clean structure) */}
          <div>
            <label className="block text-sm font-medium mb-2">Título del servicio</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-lg" placeholder="Ej: Limpieza profunda de hogar" />
          </div>

          <div>
            <div className="flex justify-between mb-3">
              <label className="block text-sm font-medium">Descripción</label>
              <button type="button" onClick={generateDescription} disabled={generating} className="flex items-center gap-2 text-sm text-orange-600">
                <Sparkles size={18} /> {generating ? 'Generando...' : 'Generar con Grok'}
              </button>
            </div>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={5} className="w-full px-5 py-4 border rounded-3xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Categoría</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-base">
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
              <h3 className="font-semibold text-lg mb-6">Detalles específicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dynamicFields.map((field, i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium mb-2">{field.label}</label>
                    {field.type === 'number' && <input type="number" onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} className="w-full px-5 py-4 border rounded-2xl" placeholder={field.placeholder} />}
                    {field.type === 'text' && <input type="text" onChange={(e) => handleCustomFieldChange(field.key, e.target.value)} className="w-full px-5 py-4 border rounded-2xl" />}
                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-3 cursor-pointer py-3">
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

          {/* Image */}
          <div>
            <label className="block text-sm font-medium mb-3">Imagen principal del servicio</label>
            <label htmlFor="image-upload" className="cursor-pointer border-2 border-dashed border-orange-300 hover:border-orange-600 rounded-3xl p-12 flex flex-col items-center">
              <ImageIcon className="w-12 h-12 text-orange-500 mb-4" />
              <span className="font-medium">Haz clic para subir imagen</span>
            </label>
            <input type="file" id="image-upload" onChange={handleImageChange} className="hidden" accept="image/*" />
            {image && <p className="mt-3 text-green-600 font-medium">✓ {image.name}</p>}
          </div>

          {error && <p className="text-red-600 bg-red-50 p-4 rounded-2xl">{error}</p>}
          {success && <p className="text-green-600 bg-green-50 p-4 rounded-2xl">{success}</p>}

          <button type="submit" disabled={loading || !image || !formData.price} className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl transition-all">
            {loading ? 'Publicando tu gig...' : 'Publicar Gig Ahora'}
          </button>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="lg:col-span-2 bg-zinc-50 border rounded-3xl p-8 h-fit sticky top-8">
            <h3 className="font-semibold mb-6 flex items-center gap-2"><Eye size={20} /> Vista previa</h3>
            <div className="bg-white rounded-2xl overflow-hidden border">
              {image ? (
                <img src={URL.createObjectURL(image)} alt="preview" className="w-full h-48 object-cover" />
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">Sin imagen</div>
              )}
              <div className="p-6">
                <h4 className="font-semibold text-xl line-clamp-2">{formData.title || 'Título del servicio'}</h4>
                <p className="text-orange-600 font-bold text-2xl mt-3">${formData.price ? Number(formData.price).toLocaleString('es-CO') : '0'}</p>
                <p className="text-sm text-gray-500 mt-4 line-clamp-4">{formData.description || 'Descripción aparecerá aquí...'}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
