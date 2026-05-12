'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [customOptions, setCustomOptions] = useState<any[]>([]);

  const addCustomOption = () => {
    setCustomOptions([...customOptions, { key: '', label: '', type: 'number', extraPrice: 0 }]);
  };

  const updateCustomOption = (index: number, field: string, value: any) => {
    const updated = [...customOptions];
    updated[index] = { ...updated[index], [field]: value };
    setCustomOptions(updated);
  };

  const removeCustomOption = (index: number) => {
    setCustomOptions(customOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !price) return toast.error("Faltan campos obligatorios");

    const gigData = {
      title,
      description,
      price: Number(price),
      category,
      completionTime,
      imageUrl: imageUrl || null,
      fields: customOptions.filter(o => o.label && o.key),
    };

    try {
      const res = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gigData)
      });
      const data = await res.json();
      toast.success("Gig creado exitosamente!");
      router.push(`/gigs/${data.id}`);
    } catch (err) {
      toast.error("Error creando el gig");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Crear Nuevo Servicio</h1>

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
                {gigCategories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
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
          <Label>Descripción del Servicio</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
        </div>

        {/* Custom Options */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <Label>Opciones Adicionales (Buyer podrá seleccionarlas)</Label>
            <Button type="button" onClick={addCustomOption} variant="outline">+ Agregar Opción Personalizada</Button>
          </div>

          {customOptions.map((opt, index) => (
            <div key={index} className="flex gap-4 items-end border p-4 rounded-xl mb-4">
              <div className="flex-1">
                <Label>Etiqueta</Label>
                <Input value={opt.label} onChange={(e) => updateCustomOption(index, 'label', e.target.value)} placeholder="Ej: Número de invitados" />
              </div>
              <div className="flex-1">
                <Label>Tipo</Label>
                <Select value={opt.type} onValueChange={(v) => updateCustomOption(index, 'type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Número (con precio por unidad)</SelectItem>
                    <SelectItem value="checkbox">Checkbox (precio fijo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Precio Extra</Label>
                <Input type="number" value={opt.extraPrice} onChange={(e) => updateCustomOption(index, 'extraPrice', Number(e.target.value))} placeholder="0" />
              </div>
              <Button type="button" variant="destructive" onClick={() => removeCustomOption(index)}>Eliminar</Button>
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full py-8 text-xl">Publicar Servicio</Button>
      </form>
    </div>
  );
}
