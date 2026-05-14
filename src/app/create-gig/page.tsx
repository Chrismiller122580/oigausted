'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const selectedCategory = gigCategories.find(c => c.name === category);

  const addCustomOption = () => {
    setCustomOptions([...customOptions, { label: '', type: 'number', extraPrice: 0 }]);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!session) return toast.error("Inicia sesión primero");

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
      toast.success("Gig creado con éxito!");
      router.push('/seller');
    } else {
      toast.error("Error al crear el gig");
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

        {/* SMART FIELDS - This is what was missing */}
        {selectedCategory && (
          <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl">
            <h3 className="font-semibold mb-4">Campos inteligentes para esta categoría</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {selectedCategory.fields.map((field: any, i: number) => (
                <div key={i} className="space-y-2">
                  <Label>{field.label}</Label>
                  {field.type === 'number' && <Input type="number" placeholder="Ej: 3" />}
                  {field.type === 'checkbox' && <input type="checkbox" className="mt-2" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Precio Base (COP)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>

        <Button type="submit" className="w-full py-6 text-lg">Publicar Servicio</Button>
      </form>
    </div>
  );
}
