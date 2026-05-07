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

  const generateWithGrok = async () => {
    if (!title || !category) {
      return toast.error('Título y categoría son requeridos');
    }

    setGenerating(true);
    try {
      const prompt = `Escribe una descripción profesional, atractiva y persuasiva para un gig llamado "${title}" en la categoría "${category}". Enfócate en beneficios para el cliente en Colombia. Máximo 300 palabras.`;

      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
        toast.success('✅ Descripción generada con Grok');
      } else {
        toast.error('No se recibió descripción');
      }
    } catch (err) {
      toast.error('Error al conectar con Grok');
    } finally {
      setGenerating(false);
    }
  };

  // ... (rest of your upload and submit logic can be added later)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Crear Nuevo Gig</h1>

      <form className="space-y-8">
        <div>
          <Label>Título del Servicio</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Limpieza de Hogar Profesional" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{categoryEmojis[cat] || ''} {cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio Base (COP)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Descripción del Servicio</Label>
            <Button 
              type="button" 
              onClick={generateWithGrok} 
              disabled={generating || !title || !category}
              variant="outline"
            >
              {generating ? '✨ Generando con Grok...' : '✨ Generar con Grok'}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} />
        </div>

        <Button type="button" className="w-full py-8 text-xl">Crear Gig</Button>
      </form>
    </div>
  );
}
