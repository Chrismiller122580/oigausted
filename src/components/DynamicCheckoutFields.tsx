'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  gig: any;
  basePrice: number;
  onFieldsChange: (fields: any, total: number) => void;
}

export default function DynamicCheckoutFields({ gig, basePrice, onFieldsChange }: Props) {
  const [formData, setFormData] = useState<any>({});
  const [totalPrice, setTotalPrice] = useState(basePrice);

  // Merge category defaults + seller custom fields (deduplicated by key)
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
      const extraPrice = Number(field.extraPrice || 0);
      if (extraPrice === 0) return;
      if (field.type === 'checkbox' && value === true) {
        total += extraPrice;
      } else if (field.type === 'number') {
        const qty = Number(value) || 0;
        total += extraPrice * qty;
      }
    });
    return Math.round(total);
  };

  // 🔥 SYNCHRONOUS callback – this is the new root-cause fix
  const handleChange = (key: string, value: any) => {
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);

    // Calculate and send to parent IMMEDIATELY (before async setState)
    const newTotal = calculateTotal(newFormData);
    setTotalPrice(newTotal);
    onFieldsChange(newFormData, newTotal);
  };

  // Safety useEffect (keeps everything in sync)
  useEffect(() => {
    const newTotal = calculateTotal(formData);
    setTotalPrice(newTotal);
    onFieldsChange(formData, newTotal);
  }, [formData, basePrice, onFieldsChange]);

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
                placeholder={`Ej: 3`}
              />
            )}
            {field.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={!!formData[field.key]}
                  onCheckedChange={(checked) => handleChange(field.key, checked)}
                />
                <span>{field.label} +${field.extraPrice}</span>
              </div>
            )}
          </div>
        ))}

        <div className="pt-4 border-t bg-orange-50 p-4 rounded-xl">
          <div className="flex justify-between items-center text-xl font-semibold">
            <span>Total estimado</span>
            <span className="text-orange-600">${totalPrice.toLocaleString('es-CO')} COP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Import at bottom (keeps all existing imports untouched)
import { gigCategories } from '@/lib/gig-categories';
