'use client';

import { useState, useEffect } from 'react';
import { gigCategories } from '@/lib/gig-categories';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  gig: any;
  basePrice: number;
  onFieldsChange: (fields: any, totalPrice: number) => void;
}

export default function DynamicCheckoutFields({ gig, basePrice, onFieldsChange }: Props) {
  const category = gigCategories.find(c => 
    c.name === gig.category || c.slug === gig.category?.toLowerCase()
  );

  const [formData, setFormData] = useState<any>({});
  const [totalPrice, setTotalPrice] = useState(basePrice);

  const handleChange = (key: string, value: any, extraPrice: number = 0) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);

    // Calculate new total
    let newTotal = basePrice;
    
    // Add extra prices from checkboxes/selects that have them
    Object.keys(newData).forEach(k => {
      // For now we use simple logic - you can extend this
      if (newData[k] === true && extraPrice > 0) {
        newTotal += extraPrice;
      }
    });

    setTotalPrice(newTotal);
    onFieldsChange(newData, newTotal);
  };

  if (!category?.fields?.length) {
    return (
      <div className="mt-8 p-8 bg-amber-50 border border-amber-200 rounded-3xl">
        <h3 className="text-lg font-semibold mb-2">📋 Notas adicionales</h3>
        <Textarea 
          placeholder="Ej: Prefiero el martes por la mañana..."
          onChange={(e) => handleChange('customNotes', e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <div>
        <h3 className="text-2xl font-semibold">📋 Detalles de tu servicio</h3>
        <p className="text-gray-600 mt-1">El precio se actualizará en tiempo real.</p>
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

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input 
                  type="checkbox"
                  onChange={(e) => handleChange(field.key, e.target.checked, field.extraPrice || 0)}
                  className="w-5 h-5 accent-orange-600"
                />
                <span>{field.label}</span>
                {field.extraPrice && <span className="text-orange-600 font-medium">+${field.extraPrice}</span>}
              </label>
            )}
          </div>
        ))}
      </div>

      {/* Live Price Update */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mt-8">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">Total estimado</span>
          <span className="text-4xl font-bold text-orange-600">
            ${totalPrice.toLocaleString('es-CO')} COP
          </span>
        </div>
      </div>
    </div>
  );
}
