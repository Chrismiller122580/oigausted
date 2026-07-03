'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  getCountrySignupUrl,
  type CountryConfig,
} from '@/lib/countries';

type CountryIntentDialogProps = {
  open: boolean;
  country: CountryConfig;
  sellerCount: number;
  onClose: () => void;
};

export function CountryIntentDialog({
  open,
  country,
  sellerCount,
  onClose,
}: CountryIntentDialogProps) {
  const router = useRouter();

  if (!open) return null;

  const goToSignup = (role: 'buyer' | 'seller') => {
    router.push(getCountrySignupUrl(country.code, role));
    onClose();
  };

  const sellOnly = sellerCount === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-intent-title"
      >
        {sellOnly ? (
          <>
            <h3 id="country-intent-title" className="text-xl font-semibold mb-2">
              ¿Quieres vender tus servicios en {country.name}?
            </h3>
            <p className="text-muted-foreground mb-6">
              Sé el primero en {country.name}. Los primeros {country.pioneerLimit} profesionales
              obtienen destacado gratis y cero comisiones el primer mes.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Ahora no
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => goToSignup('seller')}
              >
                Sí, quiero vender
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 id="country-intent-title" className="text-xl font-semibold mb-2">
              ¿Quieres comprar o vender en {country.name}?
            </h3>
            <p className="text-muted-foreground mb-6">
              Ya hay {sellerCount} profesional{sellerCount === 1 ? '' : 'es'} registrado
              {sellerCount === 1 ? '' : 's'} en {country.name}. Elige cómo quieres participar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="outline" onClick={() => goToSignup('buyer')}>
                Comprar servicios
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => goToSignup('seller')}
              >
                Vender servicios
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}