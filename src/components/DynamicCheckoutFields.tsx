'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { parseJsonArrayField } from '@/lib/utils';
import { useGigCategories } from '@/lib/useGigCategories';

interface Props {
  gig: {
    id: string;
    category: string;
    fields?: any; // TODO: replace with shared GigField[] type
  };
  formData: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export default function DynamicCheckoutFields({ gig, formData, onChange }: Props) {
  const { categories: gigCategories } = useGigCategories();
  const categoryTemplate = gigCategories.find((c: any) => c.name === gig.category) || { fields: [] };
  const gigFields = parseJsonArrayField(gig?.fields);
  const allFields = [
    ...(categoryTemplate.fields || []),
    ...gigFields
  ].filter((f: any, i: number, arr: any[]) => i === arr.findIndex(x => x.key === f.key));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Detalles de tu servicio</CardTitle>
        <p className="text-sm text-muted-foreground">El precio se actualizará en tiempo real</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {allFields.map((field: any) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            {field.type === 'number' && (
              <Input
                type="number"
                value={formData[field.key] ?? ''}
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
