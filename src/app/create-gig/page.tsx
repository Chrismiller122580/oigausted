'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories, categoryEmojis } from '@/lib/categories';
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

  const generateWithGrok = async () => {
    if (!title || !category) return toast.error('Título y categoría requeridos');

    setGenerating(true);
    try {
      const prompt = `Escribe una descripción atractiva y profesional para "${title}" en la categoría "${category}". Enfocado en beneficios para clientes en Colombia.`;
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
        toast.success('✅ Descripción generada');
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
  const updateOption = (i: number, field: string, val: any) => {
    const newOpts = [...options];
    newOpts[i][field] = val;
    setOptions(newOpts);
  };
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // submit logic...
    toast.success('Gig creado');
    router.push('/seller');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Crear Nuevo Gig</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title, Category, Price */}
        <div>
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio Base</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
        </div>

        {/* Grok Button */}
        <div>
          <div className="flex justify-between mb-2">
            <Label>Descripción</Label>
            <Button type="button" onClick={generateWithGrok} disabled={generating}>
              {generating ? 'Generando...' : '✨ Generar con Grok'}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
        </div>

        {/* Photo Upload */}
        <div>
          <Label>Imagen Principal</Label>
          <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          {uploading && <p>Subiendo...</p>}
          {imageUrl && <img src={imageUrl} className="mt-2 h-32 object-cover" />}
        </div>

        <Button type="submit" className="w-full">Crear Gig</Button>
      </form>
    </div>
  );
}
