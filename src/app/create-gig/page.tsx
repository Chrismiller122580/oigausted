'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const [customOptions, setCustomOptions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const selectedCategory = gigCategories.find(c => c.name === category);

  const addCustomOption = () => {
    setCustomOptions([...customOptions, { label: '', type: 'number', extraPrice: 0 }]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const updated = [...customOptions];
    updated[index][field] = value;
    setCustomOptions(updated);
  };

  const generateWithGrok = async () => {
    if (!title || !category) return toast.error("Escribe título y selecciona categoría");
    setGenerating(true);
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category })
      });
      const data = await res.json();
      setDescription(data.description || '');
      toast.success("Descripción generada con Grok");
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
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <h3 className="font-semibold mb-4">Detalles específicos de {selectedCategory.name}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {selectedCategory.fields.map((f: any, i: number) => (
                <div key={i}>
                  <Label>{f.label}</Label>
                  {f.type === 'number' && <Input type="number" placeholder="Ej: 3" />}
                  {f.type === 'checkbox' && <input type="checkbox" className="mt-2" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Precio Base (COP)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
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

        {/* Custom Options */}
        <div>
          <div className="flex justify-between mb-3">
            <Label>Opciones Adicionales (Buyer podrá seleccionarlas)</Label>
            <Button type="button" onClick={addCustomOption}>+ Agregar Opción</Button>
          </div>
          {customOptions.map((opt, i) => (
            <div key={i} className="flex gap-3 mb-3">
              <Input placeholder="Ej: Número de invitados" value={opt.label} onChange={(e) => updateOption(i, 'label', e.target.value)} />
              <Input type="number" placeholder="Precio extra" value={opt.extraPrice} onChange={(e) => updateOption(i, 'extraPrice', Number(e.target.value))} className="w-32" />
              <Button type="button" variant="destructive" onClick={() => setCustomOptions(customOptions.filter((_, idx) => idx !== i))}>Eliminar</Button>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full py-6 text-lg">Publicar Servicio</Button>
      </form>
    </div>
  );
}
