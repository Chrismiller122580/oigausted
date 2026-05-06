'use client';

import { useState } from 'react';
import { gigCategories } from '@/lib/gig-categories';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  gig: any;
  onFieldsChange: (fields: any) => void;
}

export default function DynamicCheckoutFields({ gig, onFieldsChange }: Props) {
  // Improved matching
  const category = gigCategories.find(c => 
    c.name === gig.category || 
    c.slug === gig.category?.toLowerCase() ||
    c.name.toLowerCase().includes(gig.category?.toLowerCase() || '') ||
    gig.category?.toLowerCase().includes(c.slug)
  );

  const [formData, setFormData] = useState<any>({});

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    onFieldsChange(newData);
  };

  if (!category?.fields?.length) {
    return (
      <div className="mt-8 p-8 bg-amber-50 border border-amber-200 rounded-3xl">
        <h3 className="text-lg font-semibold mb-2">📋 Detalles adicionales</h3>
        <p className="text-amber-700">
          Para esta categoría no se requieren campos específicos.<br />
          Puedes agregar notas adicionales abajo si lo deseas.
        </p>
        <Textarea 
          className="mt-4"
          placeholder="Ej: Prefiero que sea el martes por la mañana, dirección: Calle 45 #12-34..."
          onChange={(e) => handleChange('customNotes', e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div>
        <h3 className="text-2xl font-semibold">📋 Completa los detalles de tu servicio</h3>
        <p className="text-gray-600 mt-1">Esta información ayudará al vendedor a darte el mejor servicio posible.</p>
      </div>

      <div className="grid gap-6">
        {category.fields.map((field: any) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-base font-medium">{field.label}</Label>

            {field.type === 'number' && (
              <Input 
                type="number" 
                placeholder="Ej: 3"
                onChange={(e) => handleChange(field.key, Number(e.target.value))}
              />
            )}

            {field.type === 'select' && field.options && (
              <Select onValueChange={(value) => handleChange(field.key, value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt: string) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'text' && (
              <Input 
                type="text" 
                placeholder="Escribe aquí..."
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea 
                placeholder="Describe tus necesidades..."
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
