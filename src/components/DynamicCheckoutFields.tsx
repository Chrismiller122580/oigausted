'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const categoryTemplate = gigCategories.find((c: any) => c.name === gig.category) || { fields: [] };
  const allFields = [
    ...(categoryTemplate.fields || []),
    ...(gig.fields || [])
  ].filter((f: any, i: number, arr: any[]) => i === arr.findIndex(x => x.key === f.key));

  const calculateTotal = useCallback((data: any) => {
    let total = Number(basePrice) || 0;
    allFields.forEach((field: any) => {
      const val = data[field.key];
      if (!val) return;
      const extra = Number(field.extraPrice || 0);
      if (!extra) return;
      if (field.type === 'checkbox' && val === true) total += extra;
      else if (field.type === 'number') total += extra * (Number(val) || 0);
    });
    return Math.round(total);
  }, [basePrice, allFields]);

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    const newTotal = calculateTotal(newData);
    onFieldsChange(newData, newTotal);   // Immediate push
  };

  // Safety sync
  useEffect(() => {
    const total = calculateTotal(formData);
    onFieldsChange(formData, total);
  }, [formData, calculateTotal, onFieldsChange]);

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
                value={formData[field.key] ?? ''}
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
      </CardContent>
    </Card>
  );
}

import { gigCategories } from '@/lib/gig-categories';
