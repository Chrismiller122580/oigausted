'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { parseJsonArrayField } from '@/lib/utils';
import { useGigCategories } from '@/lib/useGigCategories';
import type { CheckoutFormData, DynamicFieldDef, GigCheckoutShape } from '@/types/gig-fields';

interface Props {
  gig: GigCheckoutShape;
  formData: CheckoutFormData;
  onChange: (key: string, value: string | number | boolean) => void;
}

export default function DynamicCheckoutFields({ gig, formData, onChange }: Props) {
  const { categories: gigCategories } = useGigCategories();
  const categoryTemplate = gigCategories.find((c) => c.name === gig.category) || { fields: [] };
  const gigFields = parseJsonArrayField(gig?.fields) as DynamicFieldDef[];
  const allFields = [
    ...(categoryTemplate.fields || []),
    ...gigFields
  ].filter((f, i: number, arr: DynamicFieldDef[]) => i === arr.findIndex(x => x.key === f.key));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Detalles de tu servicio</CardTitle>
        <p className="text-sm text-muted-foreground">El precio se actualizará en tiempo real</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {allFields.map((field: DynamicFieldDef) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            {field.type === 'number' && (
              <Input
                type="number"
                value={typeof formData[field.key] === 'boolean' ? '' : String(formData[field.key] ?? '')}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder="Ej: 3"
              />
            )}
            {field.type === 'checkbox' && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData[field.key]}
                  onChange={(e) => onChange(field.key, e.target.checked)}
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