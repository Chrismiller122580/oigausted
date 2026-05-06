'use client';

import { useState } from 'react';
import { gigCategories } from '@/lib/gig-categories';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  gig: any;
  onFieldsChange: (fields: any) => void;
}

export default function DynamicCheckoutFields({ gig, onFieldsChange }: Props) {
  const category = gigCategories.find(c => 
    c.name === gig.category || 
    c.slug === gig.category?.toLowerCase()
  );

  const [formData, setFormData] = useState<any>({});

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    onFieldsChange(newData);
  };

  if (!category?.fields?.length) {
    return <p className="text-gray-500 italic">No se requieren campos adicionales para esta categoría.</p>;
  }

  return (
    <div className="space-y-6 mt-8 border-t pt-8">
      <h3 className="text-xl font-semibold">📋 Detalles del Servicio</h3>
      
      {category.fields.map((field: any) => (
        <div key={field.key} className="space-y-2">
          <Label className="text-base">{field.label}</Label>
          
          {field.type === 'number' && (
            <Input 
              type="number" 
              placeholder="Ingrese valor"
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
            <div className="flex items-center gap-3">
              <Checkbox 
                onCheckedChange={(checked) => handleChange(field.key, checked)}
              />
              <span>{field.label}</span>
            </div>
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
  );
}
