'use client';

import { useState, useEffect } from 'react';
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
  const [basePrice, setBasePrice] = useState(0);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [customOptions, setCustomOptions] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const selectedCategory = gigCategories.find(c => c.name === category);

  const calculateTotal = () => {
    let total = basePrice || 0;
    if (selectedCategory) {
      selectedCategory.fields.forEach((field: any) => {
        if (field.type === 'number' && formData[field.key]) {
          total += Number(formData[field.key]) * (field.extraPrice || 0);
        } else if (field.type === 'checkbox' && formData[field.key]) {
          total += field.extraPrice || 0;
        }
      });
    }
    customOptions.forEach(opt => {
      if (opt.extraPrice) total += Number(opt.extraPrice || 0);
    });
    return Math.round(total);
  };

  const totalPrice = calculateTotal();

  const handleSmartFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
      if (data.url) {
        setImageUrl(data.url);
        toast.success("Imagen subida correctamente");
      } else {
        toast.error("Error subiendo imagen");
      }
    } catch (err) {
      toast.error("Error al subir la imagen");
    }
    setUploading(false);
  };

  const generateWithGrok = async () => {
    if (!title || !category) {
      return toast.error("Escribe un título y selecciona categoría");
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, type: 'gig-description' })
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
        toast.success("✅ Descripción generada con Grok");
      } else {
        toast.error("Grok no devolvió descripción");
      }
    } catch (err) {
      toast.error("No se pudo conectar con Grok");
    }
    setGenerating(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!session) return toast.error("Debes iniciar sesión");

    const res = await fetch('/api/gigs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        price: totalPrice,
        category,
        imageUrl,
        fields: selectedCategory?.fields || [],
        addons: customOptions,
        completionTime: "2-5 días"
      })
    });

    if (res.ok) {
      toast.success("¡Servicio publicado exitosamente!");
      router.push('/seller');
    } else {
      toast.error("Error al publicar");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-2">Crear Nuevo Servicio</h1>
      <p className="text-gray-600 mb-8">Llena los detalles y publica tu gig en minutos</p>

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
                <SelectValue placeholder="Selecciona una categoría" />
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

        {selectedCategory && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles específicos de {selectedCategory.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              {selectedCategory.fields.map((field: any, i: number) => (
                <div key={i}>
                  <Label>{field.label} {field.extraPrice ? `(+$${field.extraPrice})` : ''}</Label>
                  {field.type === 'number' && (
                    <Input 
                      type="number" 
                      value={formData[field.key] || ''} 
                      onChange={(e) => handleSmartFieldChange(field.key, e.target.value)}
                      className="mt-1"
                    />
                  )}
                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-3 mt-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!formData[field.key]} 
                        onChange={(e) => handleSmartFieldChange(field.key, e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <span>{field.label}</span>
                    </label>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div>
          <Label>Precio Base (COP)</Label>
          <Input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} required />
        </div>

        <div>
          <Label>Imagen del Servicio</Label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2 block w-full" />
          {imageUrl && <img src={imageUrl} alt="preview" className="mt-4 max-h-64 rounded-2xl shadow-md" />}
          {uploading && <p>Subiendo imagen...</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Descripción del Servicio</Label>
            <Button type="button" onClick={generateWithGrok} disabled={generating || !title || !category}>
              {generating ? "Generando con Grok..." : "✨ Generar con Grok"}
            </Button>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
        </div>

        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-medium">Precio Total Estimado</span>
              <span className="text-4xl font-bold text-orange-600">
                ${totalPrice.toLocaleString('es-CO')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Este precio se mostrará al comprador</p>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full py-7 text-lg font-semibold bg-orange-600 hover:bg-orange-700">
          Publicar Servicio
        </Button>
      </form>
    </div>
  );
}
