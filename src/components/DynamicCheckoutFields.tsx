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
  const [formData, setFormData] = useState<Record<string, any>>({});

  const categoryTemplate = gigCategories.find((c: any) => c.name === gig.category) || { fields: [] };
  const allFields = [
    ...(categoryTemplate.fields || []),
    ...(gig.fields || [])
  ].filter((f: any, i: number, arr: any[]) => i === arr.findIndex(x => x.key === f.key));

  const calculateTotal = useCallback((data: Record<string, any>) => {
    let total = Number(basePrice) || 0;
    allFields.forEach((field: any) => {
      const val = data[field.key];
      if (val == null || val === '') return;
      const extra = Number(field.extraPrice || 0);
      if (extra === 0) return;

      if (field.type === 'checkbox' && val === true) {
        total += extra;
      } else if (field.type === 'number') {
        const confirmedKey = field.key + '_confirmed';
        if (data[confirmedKey] === true) {
          total += extra * (Number(val) || 0);
        }
      }
    });
    return Math.round(total);
  }, [basePrice, allFields]);

  const handleNumberChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleConfirm = (key: string) => {
    const confirmedKey = key + '_confirmed';
    const newData = { 
      ...formData, 
      [confirmedKey]: !formData[confirmedKey] 
    };
    setFormData(newData);
    
    const newTotal = calculateTotal(newData);
    onFieldsChange(newData, newTotal);
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    const newData = { ...formData, [key]: checked };
    setFormData(newData);
    const newTotal = calculateTotal(newData);
    onFieldsChange(newData, newTotal);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Detalles de tu servicio</CardTitle>
        <p className="text-sm text-gray-500">Ingresa cantidad y marca el check para aplicar al precio</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {allFields.map((field: any) => (
          <div key={field.key} className="flex items-start gap-4">
            <div className="flex-1">
              <Label>{field.label}</Label>
              {field.type === 'number' && (
                <Input
                  type="number"
                  value={formData[field.key] ?? ''}
                  onChange={(e) => handleNumberChange(field.key, e.target.value)}
                  placeholder="Ej: 3"
                  className="mt-1"
                />
              )}
            </div>

            {field.type === 'number' && (
              <label className="flex flex-col items-center cursor-pointer pt-6">
                <input
                  type="checkbox"
                  checked={!!formData[field.key + '_confirmed']}
                  onChange={() => toggleConfirm(field.key)}
                  className="w-6 h-6 accent-orange-600"
                />
                <span className="text-xs text-gray-500 mt-1">Aplicar</span>
              </label>
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-3 cursor-pointer flex-1 pt-6">
                <input
                  type="checkbox"
                  checked={!!formData[field.key]}
                  onChange={(e) => handleCheckboxChange(field.key, e.target.checked)}
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
