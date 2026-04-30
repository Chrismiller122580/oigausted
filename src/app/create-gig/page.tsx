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

    // ==================== FULL EXPANDED LIST ====================
    if (cat === 'Limpieza de Hogar y Oficinas') {
      fields = [
        { key: 'rooms', label: 'Número de habitaciones', type: 'number', placeholder: '3' },
        { key: 'bathrooms', label: 'Número de baños', type: 'number', placeholder: '2' },
        { key: 'deepClean', label: '¿Limpieza profunda?', type: 'checkbox' },
        { key: 'pets', label: '¿Hay mascotas?', type: 'checkbox' },
      ];
    } else if (cat.includes('Transporte') || cat.includes('Mudanzas') || cat.includes('Delivery') || cat.includes('Mensajería')) {
      fields = [
        { key: 'pickupAddress', label: 'Dirección de recogida', type: 'text' },
        { key: 'deliveryAddress', label: 'Dirección de entrega', type: 'text' },
        { key: 'packageSize', label: 'Tamaño del paquete', type: 'select', options: ['Pequeño', 'Mediano', 'Grande'] },
        { key: 'urgent', label: '¿Entrega urgente?', type: 'checkbox' },
      ];
    } else if (cat === 'Reparaciones y Mantenimiento del Hogar') {
      fields = [
        { key: 'problemType', label: 'Tipo de reparación', type: 'select', options: ['Eléctrica', 'Plomería', 'Pintura', 'Carpintería', 'Otra'] },
        { key: 'urgency', label: 'Urgencia', type: 'select', options: ['Hoy mismo', 'Esta semana', 'Normal'] },
      ];
    } else if (cat === 'Clases Particulares' || cat.includes('Clases') || cat.includes('Tutorías')) {
      fields = [
        { key: 'level', label: 'Nivel', type: 'select', options: ['Principiante', 'Intermedio', 'Avanzado'] },
        { key: 'duration', label: 'Duración por sesión (horas)', type: 'number', placeholder: '1.5' },
        { key: 'online', label: '¿Clases virtuales?', type: 'checkbox' },
      ];
    } else if (cat === 'Diseño Gráfico y Logos' || cat.includes('Diseño')) {
      fields = [
        { key: 'format', label: 'Formato entregable', type: 'select', options: ['PNG', 'SVG', 'PDF', 'Editable'] },
        { key: 'revisions', label: 'Revisiones incluidas', type: 'number', placeholder: '2' },
      ];
    } else if (cat === 'Fotografía y Video' || cat.includes('Foto') || cat.includes('Video')) {
      fields = [
        { key: 'duration', label: 'Duración del servicio', type: 'select', options: ['1 hora', 'Medio día', 'Día completo'] },
        { key: 'editing', label: '¿Incluye edición?', type: 'checkbox' },
      ];
    } else if (cat === 'Belleza y Maquillaje a Domicilio') {
      fields = [
        { key: 'serviceType', label: 'Tipo de servicio', type: 'select', options: ['Maquillaje', 'Peinado', 'Uñas', 'Paquete completo'] },
        { key: 'people', label: 'Número de personas', type: 'number', placeholder: '1' },
      ];
    } else if (cat.includes('IA') || cat.includes('Inteligencia') || cat.includes('Documentos') || cat.includes('Redacción') || cat.includes('Copywriting')) {
      fields = [
        { key: 'serviceType', label: 'Tipo de servicio', type: 'select', options: ['Redacción', 'Traducción', 'Resumen', 'Generación de imágenes', 'Otro'] },
        { key: 'wordCount', label: 'Cantidad aproximada de palabras', type: 'number', placeholder: '500' },
      ];
    } else if (cat.includes('Eventos') || cat.includes('Fiestas') || cat.includes('Gestión')) {
      fields = [
        { key: 'guests', label: 'Número de invitados', type: 'number', placeholder: '50' },
        { key: 'locationType', label: 'Tipo de lugar', type: 'select', options: ['Casa', 'Salón', 'Al aire libre'] },
      ];
    } else if (cat === 'Música y DJ para Eventos') {
      fields = [
        { key: 'eventType', label: 'Tipo de evento', type: 'select', options: ['Boda', 'Fiesta', 'Corporativo', 'Otro'] },
        { key: 'hours', label: 'Horas de servicio', type: 'number', placeholder: '4' },
      ];
    } else if (cat === 'Asesoría Legal y Tributaria') {
      fields = [
        { key: 'serviceType', label: 'Tipo de asesoría', type: 'select', options: ['Impuestos', 'Contratos', 'Empresa', 'Personal'] },
      ];
    } else if (cat === 'Cocina Casera y Catering') {
      fields = [
        { key: 'people', label: 'Número de personas', type: 'number', placeholder: '20' },
        { key: 'cuisine', label: 'Tipo de comida', type: 'select', options: ['Colombiana', 'Internacional', 'Vegetariana', 'Otro'] },
      ];
    } else if (cat === 'Artesanías y Productos Hechos a Mano') {
      fields = [
        { key: 'material', label: 'Material principal', type: 'text' },
        { key: 'deliveryTime', label: 'Tiempo de entrega (días)', type: 'number', placeholder: '7' },
      ];
    } else if (cat === 'Cuidado Holístico y Bienestar') {
      fields = [
        { key: 'serviceType', label: 'Tipo de servicio', type: 'select', options: ['Masajes', 'Yoga', 'Meditación', 'Reiki'] },
        { key: 'duration', label: 'Duración (minutos)', type: 'number', placeholder: '60' },
      ];
    } else if (cat === 'Marketing Digital y Redes Sociales') {
      fields = [
        { key: 'platform', label: 'Plataformas', type: 'text', placeholder: 'Instagram, Facebook' },
        { key: 'goal', label: 'Objetivo', type: 'select', options: ['Más seguidores', 'Más ventas', 'Branding'] },
      ];
    } else if (cat === 'Desarrollo Web y Tiendas Online') {
      fields = [
        { key: 'projectType', label: 'Tipo de proyecto', type: 'select', options: ['Landing Page', 'Tienda Online', 'Blog', 'Otro'] },
        { key: 'revisions', label: 'Revisiones incluidas', type: 'number', placeholder: '3' },
      ];
    } else if (cat === 'Edición de Video y Contenido Audiovisual') {
      fields = [
        { key: 'videoLength', label: 'Duración del video (minutos)', type: 'number', placeholder: '5' },
        { key: 'style', label: 'Estilo', type: 'select', options: ['Corporativo', 'Creativo', 'Publicidad'] },
      ];
    } else if (cat === 'Asistente Virtual y Soporte Administrativo') {
      fields = [
        { key: 'hoursPerWeek', label: 'Horas por semana', type: 'number', placeholder: '10' },
        { key: 'tasks', label: 'Tareas principales', type: 'text' },
      ];
    } else if (cat === 'Diseño de Interiores y Arquitectura') {
      fields = [
        { key: 'projectType', label: 'Tipo de proyecto', type: 'select', options: ['Residencial', 'Comercial', 'Remodelación'] },
        { key: 'area', label: 'Área aproximada (m²)', type: 'number', placeholder: '80' },
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
    if (!formData.title || !formData.category) return setError("Title and category are required");
    setGenerating(true);
    try {
      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Write a professional, attractive description in Colombian Spanish for this gig: ${formData.category} - ${formData.title}` 
        })
      });
      const data = await res.json();
      if (data.reply) setFormData(prev => ({ ...prev, description: data.reply }));
    } catch {
      setError("Error with Grok");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !formData.price || !formData.title) return setError('Missing required fields (title, price, image)');

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

      if (!res.ok) throw new Error('Failed to publish gig');
      setSuccess('Gig published successfully! Redirecting...');
      setTimeout(() => router.push('/gigs'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/seller" className="text-orange-600 hover:underline mb-8 inline-flex items-center gap-2">← Back to Seller Dashboard</Link>

      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-5xl font-bold">Publish Your Service</h1>
          <p className="text-xl text-gray-600">Smart fields for every category</p>
        </div>
        <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 text-orange-600 hover:text-orange-700">
          <Eye size={20} /> {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 bg-white p-10 rounded-3xl border space-y-10">
          <div>
            <label className="block text-sm font-medium mb-2">Service Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-lg" placeholder="e.g. Deep home cleaning" />
          </div>

          <div>
            <div className="flex justify-between mb-3">
              <label className="block text-sm font-medium">Description</label>
              <button type="button" onClick={generateDescription} disabled={generating} className="text-orange-600 flex items-center gap-1 text-sm">
                <Sparkles size={18} /> Generate with Grok
              </button>
            </div>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={5} className="w-full px-5 py-4 border rounded-3xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl">
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {categoryEmojis[cat] || '•'} {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price (COP)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-2xl text-lg" placeholder="85000" />
            </div>
          </div>

          {/* Dynamic Fields - Now covers ALL categories */}
          {dynamicFields.length > 0 && (
            <div className="border-t pt-8">
              <h3 className="font-semibold text-lg mb-6">Specific Service Details</h3>
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
                        <option value="">Select...</option>
                        {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-3">Main Image</label>
            <label htmlFor="image-upload" className="cursor-pointer border-2 border-dashed border-orange-300 hover:border-orange-600 rounded-3xl p-12 flex flex-col items-center">
              <ImageIcon className="w-12 h-12 text-orange-500 mb-4" />
              <span>Click to upload image</span>
            </label>
            <input type="file" id="image-upload" onChange={handleImageChange} className="hidden" accept="image/*" />
            {image && <p className="mt-3 text-green-600">✓ {image.name}</p>}
          </div>

          {error && <p className="text-red-600 bg-red-50 p-4 rounded-2xl">{error}</p>}
          {success && <p className="text-green-600 bg-green-50 p-4 rounded-2xl">{success}</p>}

          <button type="submit" disabled={loading || !image || !formData.price} className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-5 rounded-2xl text-xl">
            {loading ? 'Publishing Gig...' : 'Publish Gig'}
          </button>
        </div>

        {showPreview && (
          <div className="lg:col-span-2 bg-zinc-50 border rounded-3xl p-8 h-fit sticky top-8">
            <h3 className="font-semibold mb-6">Gig Preview</h3>
            <div className="bg-white rounded-2xl overflow-hidden border">
              {image ? <img src={URL.createObjectURL(image)} className="w-full h-48 object-cover" alt="preview" /> : <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">No image yet</div>}
              <div className="p-6">
                <h4 className="font-semibold text-xl">{formData.title || 'Service Title'}</h4>
                <p className="text-3xl font-bold text-orange-600 mt-2">${formData.price ? Number(formData.price).toLocaleString('es-CO') : '0'}</p>
                <p className="text-sm text-gray-600 mt-4 line-clamp-4">{formData.description || 'Description will appear here...'}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
