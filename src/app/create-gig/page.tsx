'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
  const [uploading, setUploading] = useState(false);
  const [customOptions, setCustomOptions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const selectedCategory = gigCategories.find(c => c.name === category);

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) setImageUrl(data.url);
    setUploading(false);
  };

  const generateWithGrok = async () => {
    if (!title || !category) return toast.error("Título y categoría son obligatorios");
    setGenerating(true);
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, type: 'gig-description' })
      });
      const data = await res.json();
      setDescription(data.description || '');
      toast.success("Descripción generada con Grok ✨");
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
      toast.success("¡Servicio publicado con éxito!");
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

        {/* Smart Fields */}
        {selectedCategory && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Detalles específicos de {selectedCategory.name}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {selectedCategory.fields.map((f: any, i: number) => (
                  <div key={i}>
                    <Label>{f.label}</Label>
                    {f.type === 'number' && <Input type="number" placeholder="Ej: 3" className="mt-1" />}
                    {f.type === 'checkbox' && (
                      <label className="flex items-center gap-3 mt-2 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 accent-orange-600" />
                        <span>{f.label}</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <Label>Precio Base (COP)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>

        <div>
          <Label>Imagen del Servicio</Label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2" />
          {imageUrl && <img src={imageUrl} alt="preview" className="mt-4 max-h-48 rounded-xl" />}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Descripción del Servicio</Label>
            <Button type="button" onClick={generateWithGrok} disabled={generating || !title || !category}>
              {generating ? "Generando..." : "✨ Generar con Grok"}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
        </div>

        {/* Custom Options */}
        <div>
          <div className="flex justify-between mb-4">
            <Label>Opciones Adicionales</Label>
            <Button type="button" onClick={() => setCustomOptions([...customOptions, { label: '', type: 'number', extraPrice: 0 }])}>+ Agregar Opción</Button>
          </div>
          {customOptions.map((opt, i) => (
            <div key={i} className="flex gap-3 mb-4 items-end">
              <div className="flex-1">
                <Label>Etiqueta</Label>
                <Input value={opt.label} onChange={(e) => {
                  const updated = [...customOptions];
                  updated[i].label = e.target.value;
                  setCustomOptions(updated);
                }} />
              </div>
              <div className="w-32">
                <Label>Precio Extra</Label>
                <Input type="number" value={opt.extraPrice} onChange={(e) => {
                  const updated = [...customOptions];
                  updated[i].extraPrice = Number(e.target.value);
                  setCustomOptions(updated);
                }} />
              </div>
              <Button type="button" variant="destructive" onClick={() => setCustomOptions(customOptions.filter((_, idx) => idx !== i))}>Eliminar</Button>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full py-6 text-lg">Publicar Servicio</Button>
      </form>
    </div>
  );
}
