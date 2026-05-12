'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  gig: any;
  basePrice: number;
  onPriceChange: (total: number, fields: any) => void;
}

export default function DynamicCheckoutFields({ gig, basePrice, onPriceChange }: Props) {
  const [formData, setFormData] = useState<any>({});

  const categoryTemplate = gigCategories.find((c: any) => c.name === gig.category) || { fields: [] };
  const allFields = [
    ...(categoryTemplate.fields || []),
    ...(gig.fields || [])
  ].filter((f: any, i: number, arr: any[]) => i === arr.findIndex(x => x.key === f.key));

  const calculateAndSend = (newData: any) => {
    let total = Number(basePrice) || 0;

    allFields.forEach((field: any) => {
      const val = newData[field.key];
      if (val == null || val === '') return;
      const extra = Number(field.extraPrice || 0);
      if (extra === 0) return;

      if (field.type === 'checkbox' && val === true) total += extra;
      else if (field.type === 'number') total += extra * (Number(val) || 0);
    });

    onPriceChange(Math.round(total), newData);
  };

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    calculateAndSend(newData);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Detalles de tu servicio</CardTitle>
        <p className="text-sm text-gray-500">El precio se actualizará en tiempo real</p>
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
