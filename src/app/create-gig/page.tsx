'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories, categoryEmojis } from '@/lib/categories';
import { gigCategories } from '@/lib/gig-categories';
import { toast } from 'react-hot-toast';

export default function CreateGigPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [completionTime, setCompletionTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState<any[]>([]);

  // Load category defaults when category changes
  useEffect(() => {
    if (!category) return;
    const template = gigCategories.find(c => 
      c.name === category || c.slug === category.toLowerCase()
    );
    if (template?.fields) {
      setOptions(template.fields.map(f => ({
        label: f.label,
        extraPrice: f.extraPrice || 0,
        key: f.key,
        type: f.type
      })));
    }
  }, [category]);

  const generateWithGrok = async () => {
    if (!title || !category) return toast.error('Título y categoría son requeridos');
    setGenerating(true);
    try {
      const prompt = `Escribe una descripción atractiva y profesional para "${title}" en la categoría "${category}".`;
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
        toast.success('✅ Descripción generada con Grok');
      }
    } catch (err) {
      toast.error('Error con Grok');
    } finally {
      setGenerating(false);
    }
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
    } catch (err) {
      toast.error('Error subiendo imagen');
    } finally {
      setUploading(false);
    }
  };

  const addOption = () => setOptions([...options, { label: '', extraPrice: 0 }]);
  const updateOption = (index: number, field: string, val: any) => {
    const newOpts = [...options];
    newOpts[index][field] = val;
    setOptions(newOpts);
  };
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/gigs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        description, 
        price: Number(price), 
        category, 
        completionTime, 
        imageUrl, 
        fields: options 
      })
    });
    if (res.ok) {
      toast.success('✅ Gig creado con éxito');
      router.push('/seller');
    } else toast.error('Error creando gig');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Crear Nuevo Gig</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <Label>Título del Servicio</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Limpieza de Hogar Profesional" required />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    <span className="mr-3 text-lg">{categoryEmojis[cat] || '📌'}</span> {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio Base (COP)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Descripción del Servicio</Label>
            <Button type="button" onClick={generateWithGrok} disabled={generating || !title || !category} variant="outline">
              {generating ? '✨ Generando con Grok...' : '✨ Generar con Grok'}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} required />
        </div>

        <div>
          <Label>Imagen Principal del Gig</Label>
          <div className="flex items-center gap-4">
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="flex-1" />
            {imageUrl && <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border" />}
          </div>
          {uploading && <p className="text-orange-600 text-sm mt-1">Subiendo imagen...</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <Label>Opciones Adicionales (Buyer podrá seleccionarlas)</Label>
            <Button type="button" onClick={addOption} variant="outline">+ Agregar Opción Personalizada</Button>
          </div>
          {options.map((opt, index) => (
            <div key={index} className="flex gap-4 mb-4 p-4 border rounded-2xl">
              <Input placeholder="Nombre de la opción" value={opt.label} onChange={e => updateOption(index, 'label', e.target.value)} className="flex-1" />
              <Input type="number" placeholder="Precio extra" value={opt.extraPrice} onChange={e => updateOption(index, 'extraPrice', Number(e.target.value))} className="w-40" />
              <Button type="button" variant="destructive" onClick={() => removeOption(index)}>Eliminar</Button>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full py-8 text-xl">Crear Gig</Button>
      </form>
    </div>
  );
}
