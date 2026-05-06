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
  const category = gigCategories.find(c => 
    c.name === gig.category || c.slug === gig.category?.toLowerCase()
  );

  const [formData, setFormData] = useState<any>({});

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    onFieldsChange(newData);
  };

  if (!category?.fields?.length) {
    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
        <p className="text-gray-500">No se requieren detalles adicionales para esta categoría.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <h3 className="text-2xl font-semibold">📋 Completa los detalles de tu servicio</h3>
      <p className="text-gray-600">Esta información ayudará al vendedor a prepararse mejor.</p>

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
