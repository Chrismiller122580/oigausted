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
  // Improved fuzzy matching
  const category = gigCategories.find(c => {
    const gigCat = (gig.category || '').toLowerCase();
    const catName = c.name.toLowerCase();
    const catSlug = c.slug.toLowerCase();

    return gigCat === catName || 
           gigCat === catSlug ||
           catName.includes(gigCat) ||
           gigCat.includes(catSlug) ||
           catName.includes('limpieza') && gigCat.includes('limpieza');
  });

  const [formData, setFormData] = useState<any>({});

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    onFieldsChange(newData);
  };

  console.log("Gig category:", gig.category, "Matched:", category?.name);

  if (!category?.fields?.length) {
    return (
      <div className="mt-8 p-8 bg-amber-50 border border-amber-200 rounded-3xl">
        <h3 className="text-lg font-semibold mb-2">📋 Notas adicionales</h3>
        <Textarea 
          placeholder="Ej: Prefiero servicio el martes por la mañana, 3 habitaciones, etc..."
          onChange={(e) => handleChange('customNotes', e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <h3 className="text-2xl font-semibold">📋 Completa los detalles de tu servicio</h3>
      <p className="text-gray-600">Esta información ayudará al vendedor a darte el mejor servicio.</p>

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

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-3 cursor-pointer py-1">
                <input 
                  type="checkbox"
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="w-5 h-5 accent-orange-600"
                />
                <span>{field.label}</span>
              </label>
            )}

            {field.type === 'text' && (
              <Input 
                type="text" 
                placeholder="Escribe aquí..."
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
