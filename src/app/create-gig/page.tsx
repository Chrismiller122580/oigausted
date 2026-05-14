'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { gigCategories } from '@/lib/gig-categories';
import { toast } from 'react-hot-toast';

export default function CreateGigPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [completionTime, setCompletionTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [customOptions, setCustomOptions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const selectedCategory = gigCategories.find(c => c.name === category);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      setImageUrl(data.url);
      toast.success("Imagen subida");
    }
  };

  const generateWithGrok = async () => {
    if (!title || !category) return toast.error("Título y categoría son obligatorios");
    setGenerating(true);
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category })
      });
      const data = await res.json();
      setDescription(data.description || '');
      toast.success("Grok generó descripción y precio sugerido");
    } catch (e) {
      toast.error("Grok no respondió");
    }
    setGenerating(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!session) return toast.error("Inicia sesión");

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
        fields: selectedCategory?.fields || [],
        addons: customOptions
      })
    });

    if (res.ok) {
      toast.success("¡Servicio publicado!");
      router.push('/seller');
    } else {
      toast.error("Error al publicar");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Crear Nuevo Servicio</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Título del Servicio</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {gigCategories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SMART FIELDS */}
        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles específicos de {selectedCategory.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 pt-2">
              {selectedCategory.fields.map((f: any, i: number) => (
                <div key={i}>
                  <Label>{f.label} {f.extraPrice ? `(+$${f.extraPrice})` : ''}</Label>
                  {f.type === 'number' && <Input type="number" className="mt-1" placeholder="Ej: 3" />}
                  {f.type === 'checkbox' && (
                    <label className="flex items-center gap-3 mt-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 accent-orange-600" />
                      <span>{f.label}</span>
                    </label>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div>
          <Label>Precio Base (COP)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>

        <div>
          <Label>Imagen del Servicio</Label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2 block w-full" />
          {imageUrl && <img src={imageUrl} alt="preview" className="mt-4 max-h-48 rounded-xl" />}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Descripción del Servicio</Label>
            <Button type="button" onClick={generateWithGrok} disabled={generating || !title || !category}>
              {generating ? "Generando..." : "✨ Generar con Grok"}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
        </div>

        <Button type="submit" className="w-full py-6 text-lg">Publicar Servicio</Button>
      </form>
    </div>
  );
}
