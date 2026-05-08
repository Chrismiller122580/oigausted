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
  const gigCat = (gig.category || '').toString().toLowerCase().trim();

  const category = gigCategories.find(c => 
    c.name.toLowerCase() === gigCat ||
    c.slug.toLowerCase() === gigCat ||
    c.name.toLowerCase().includes(gigCat) ||
    gigCat.includes(c.slug.toLowerCase())
  ) || gigCategories.find(c => c.slug === "otros");

  const [formData, setFormData] = useState<any>({});
  const [totalPrice, setTotalPrice] = useState(basePrice);

  const handleChange = (key: string, value: any, extraPrice = 0) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);

    let newTotal = basePrice;
    if (value === true && extraPrice > 0) newTotal += extraPrice;

    setTotalPrice(newTotal);
    onFieldsChange(newData, newTotal);
  };

  if (!category?.fields?.length) {
    return (
      <div className="mt-8 p-8 bg-amber-50 border border-amber-200 rounded-3xl">
        <h3 className="text-lg font-semibold mb-2">📋 Notas adicionales</h3>
        <Textarea 
          placeholder="Describe cualquier detalle importante..."
          onChange={(e) => handleChange('customNotes', e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <h3 className="text-2xl font-semibold">📋 Detalles de tu servicio</h3>
      <p className="text-gray-600">El precio se actualizará en tiempo real según tus selecciones.</p>

      <div className="grid gap-6">
        {category.fields.map((field: any) => (
          <div key={field.key} className="space-y-2">
            <Label className="text-base font-medium">{field.label}</Label>

            {field.type === 'number' && (
              <Input type="number" placeholder={field.placeholder || "Ej: 3"} onChange={(e) => handleChange(field.key, Number(e.target.value))} />
            )}

            {field.type === 'select' && field.options && (
              <Select onValueChange={(v) => handleChange(field.key, v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {field.options.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <input type="checkbox" onChange={(e) => handleChange(field.key, e.target.checked, field.extraPrice || 0)} className="w-5 h-5 accent-orange-600" />
                <span>{field.label}</span>
                {field.extraPrice && <span className="text-sm text-orange-600">+${field.extraPrice}</span>}
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-6">
        <div className="flex justify-between items-center text-xl">
          <span className="font-medium">Total estimado</span>
          <span className="font-bold text-orange-600">${totalPrice.toLocaleString('es-CO')} COP</span>
        </div>
      </div>
    </div>
  );
}
