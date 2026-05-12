'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  gig: any;
  basePrice: number;
  onFieldsChange: (fields: any, total: number) => void;
}

export default function DynamicCheckoutFields({ gig, basePrice, onFieldsChange }: Props) {
  const [formData, setFormData] = useState<any>({});
  const [totalPrice, setTotalPrice] = useState(basePrice);

  const categoryTemplate = gigCategories.find((c: any) => c.name === gig.category) || { fields: [] };
  const allFields = [
    ...(categoryTemplate.fields || []),
    ...(gig.fields || [])
  ].filter((field: any, index: number, self: any[]) =>
    index === self.findIndex((f: any) => f.key === field.key)
  );

  const calculateTotal = (data: any) => {
    let total = Number(basePrice) || 0;
    allFields.forEach((field: any) => {
      const value = data[field.key];
      if (value === undefined || value === null || value === '') return;
      const extra = Number(field.extraPrice || 0);
      if (extra === 0) return;
      if (field.type === 'checkbox' && value === true) total += extra;
      else if (field.type === 'number') total += extra * (Number(value) || 0);
    });
    return Math.round(total);
  };

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    const newTotal = calculateTotal(newData);
    setTotalPrice(newTotal);
    onFieldsChange(newData, newTotal);   // ← synchronous push
  };

  useEffect(() => {
    const newTotal = calculateTotal(formData);
    setTotalPrice(newTotal);
    onFieldsChange(formData, newTotal);
  }, [formData, basePrice]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Detalles de tu servicio</CardTitle>
        <p className="text-sm text-gray-500">El precio se actualizará en tiempo real.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {allFields.map((field: any) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            {field.type === 'number' && (
              <Input
                type="number"
                value={formData[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder="Ej: 3"
              />
            )}
            {field.type === 'checkbox' && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="w-5 h-5 accent-orange-600"
                />
                <span>{field.label} +${field.extraPrice}</span>
              </label>
            )}
          </div>
        ))}

        <div className="pt-4 border-t bg-orange-50 p-4 rounded-xl">
          <div className="flex justify-between text-xl font-semibold">
            <span>Total estimado</span>
            <span className="text-orange-600">${totalPrice.toLocaleString('es-CO')} COP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { gigCategories } from '@/lib/gig-categories';
