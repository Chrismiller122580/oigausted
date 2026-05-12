'use client';

import { useState } from 'react';
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

  const categoryTemplate = gigCategories.find(c => 
    c.name.toLowerCase() === gigCat || 
    c.slug?.toLowerCase() === gigCat ||
    c.name.toLowerCase().includes(gigCat)
  );

  const allFields = [
    ...(categoryTemplate?.fields || []),
    ...(gig.fields || [])
  ];

  const [formData, setFormData] = useState<any>({});
  const [totalPrice, setTotalPrice] = useState(basePrice);

  const calculateTotal = (data: any) => {
    let total = basePrice || 0;

    allFields.forEach(field => {
      if (field.extraPrice && data[field.key] === true) {
        total += Number(field.extraPrice);
      }
    });

    return Math.round(total);
  };

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);

    const newTotal = calculateTotal(newData);
    setTotalPrice(newTotal);
    onFieldsChange(newData, newTotal);
  };

  if (allFields.length === 0) {
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
      <h3 className="text-2xl font-semibold">📋 Detalles de tu servicio</h3>
      <p className="text-gray-600">El precio se actualizará en tiempo real.</p>

      <div className="grid gap-6">
        {allFields.map((field: any, idx: number) => (
          <div key={idx} className="space-y-2">
            <Label className="text-base font-medium">{field.label}</Label>

            {field.type === 'number' && (
              <Input 
                type="number" 
                placeholder="Ej: 3"
                onChange={(e) => handleChange(field.key, Number(e.target.value) || 0)}
              />
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
                <input 
                  type="checkbox"
                  checked={!!formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="w-5 h-5 accent-orange-600"
                />
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
          <span className="font-bold text-orange-600">
            ${totalPrice.toLocaleString('es-CO')} COP
          </span>
        </div>
      </div>
    </div>
  );
}
