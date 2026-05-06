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
  const gigCategory = (gig.category || '').toLowerCase().trim();

  // Enhanced matching
  const category = gigCategories.find(c => {
    const name = c.name.toLowerCase();
    const slug = c.slug.toLowerCase();
    
    return name === gigCategory ||
           slug === gigCategory ||
           name.includes(gigCategory) ||
           gigCategory.includes(slug) ||
           (gigCategory.includes('limpieza') && name.includes('limpieza')) ||
           (gigCategory.includes('clean') && name.includes('limpieza'));
  });

  const [formData, setFormData] = useState<any>({});

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    onFieldsChange(newData);
  };

  console.log(`Gig category: "${gig.category}" → Matched: ${category?.name || 'None'}`);

  if (!category?.fields?.length) {
    return (
      <div className="mt-8 p-8 bg-blue-50 border border-blue-200 rounded-3xl">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          📝 Notas adicionales para el vendedor
        </h3>
        <Textarea 
          placeholder="Ej: Quiero el servicio el martes por la mañana, 3 habitaciones, enfocado en cocina y baños..."
          className="min-h-[120px]"
          onChange={(e) => handleChange('customNotes', e.target.value)}
        />
        <p className="text-xs text-blue-600 mt-3">Esta información se guardará con tu pedido.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-8">
        <h3 className="text-2xl font-semibold mb-2">📋 Detalles de tu pedido</h3>
        <p className="text-gray-600">Ayuda al vendedor a prepararse mejor para tu servicio.</p>
      </div>

      <div className="space-y-6">
        {category.fields.map((field: any) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-base font-medium text-gray-800">{field.label}</Label>

            {field.type === 'number' && (
              <Input 
                type="number" 
                placeholder="Ej: 3"
                onChange={(e) => handleChange(field.key, Number(e.target.value))}
                className="text-lg"
              />
            )}

            {field.type === 'select' && field.options && (
              <Select onValueChange={(value) => handleChange(field.key, value)}>
                <SelectTrigger className="text-lg">
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
              <label className="flex items-center gap-3 cursor-pointer py-2 px-1 hover:bg-gray-50 rounded-xl">
                <input 
                  type="checkbox"
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="w-5 h-5 accent-orange-600"
                />
                <span className="text-base">{field.label}</span>
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
