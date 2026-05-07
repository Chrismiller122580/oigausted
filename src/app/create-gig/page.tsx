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

  const [options, setOptions] = useState<any[]>([]);

  const generateWithGrok = async () => {
    if (!title || !category) return toast.error('Título y categoría son requeridos');

    setGenerating(true);
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category })
      });

      const data = await res.json();
      setDescription(data.description || 'Descripción generada por Grok AI.');
      toast.success('Descripción generada con Grok');
    } catch (err) {
      toast.error('Error generando descripción');
    } finally {
      setGenerating(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { label: '', extraPrice: 0 }]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        fields: options,
      })
    });

    if (res.ok) {
      toast.success('Gig creado con éxito');
      router.push('/seller');
    } else {
      toast.error('Error creando gig');
    }
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
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{categoryEmojis[cat] || ''} {cat}</SelectItem>
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
            <Label>Descripción</Label>
            <Button type="button" onClick={generateWithGrok} disabled={generating || !title || !category} variant="outline">
              {generating ? 'Generando...' : '✨ Generar con Grok'}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} required />
        </div>

        {/* Dynamic Options with Prices */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <Label>Opciones Adicionales (Buyer selecciona en checkout)</Label>
            <Button type="button" onClick={addOption} variant="outline">+ Agregar Opción</Button>
          </div>

          {options.map((option, index) => (
            <div key={index} className="flex gap-4 mb-4 p-4 border rounded-2xl">
              <Input 
                placeholder="Nombre de la opción (ej: Limpieza profunda)" 
                value={option.label} 
                onChange={(e) => updateOption(index, 'label', e.target.value)} 
                className="flex-1"
              />
              <Input 
                type="number" 
                placeholder="Precio extra" 
                value={option.extraPrice} 
                onChange={(e) => updateOption(index, 'extraPrice', Number(e.target.value))} 
                className="w-32"
              />
              <Button type="button" variant="destructive" onClick={() => setOptions(options.filter((_, i) => i !== index))}>
                Eliminar
              </Button>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full py-8 text-xl">Crear Gig</Button>
      </form>
    </div>
  );
}
