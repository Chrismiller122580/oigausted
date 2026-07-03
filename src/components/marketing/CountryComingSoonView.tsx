'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorldwideHeader } from '@/components/marketing/WorldwideHeader';
import { CountryIntentDialog } from '@/components/marketing/CountryIntentDialog';
import { HomeFooter } from '@/components/homepage/HomeFooter';
import { Button } from '@/components/ui/button';
import { getCountrySignupUrl, type CountryConfig } from '@/lib/countries';

type CountryComingSoonViewProps = {
  country: CountryConfig;
  sellerCount: number;
};

export function CountryComingSoonView({
  country,
  sellerCount,
}: CountryComingSoonViewProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const openPioneerDialog = () => setDialogOpen(true);

  const openNotifySignup = () => {
    router.push(getCountrySignupUrl(country.code, 'buyer'));
  };

  return (
    <>
      <WorldwideHeader activeCountry={country.code} />

      <section
        className="text-white py-16 sm:py-20"
        style={{ background: country.heroGradient }}
      >
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-4 flex justify-center gap-3 text-5xl sm:text-6xl">
            <span aria-hidden>{country.flag}</span>
            <span aria-hidden>🇨🇴</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            OigaGIG {country.name} • Próximamente
          </h1>
          <p className="mt-4 text-xl sm:text-2xl">
            Gigs locales • Profesionales de confianza • {country.paymentLabel}
          </p>
          {country.poweredBy ? (
            <p className="mt-6 text-lg sm:text-xl">
              Impulsado por <strong>{country.poweredBy}</strong> 🇨🇴
            </p>
          ) : null}

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="rounded-xl bg-white px-8 py-6 text-lg font-bold text-blue-700 hover:bg-white/90"
              onClick={openPioneerDialog}
            >
              Sé el primer profesional en {country.name} → destacado GRATIS
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-2 border-white bg-transparent px-8 py-6 text-lg font-bold text-white hover:bg-white/10"
              onClick={openNotifySignup}
            >
              Avísame cuando esté en vivo
            </Button>
          </div>

          <p className="mt-8 text-sm text-white/90">
            Los primeros {country.pioneerLimit} profesionales obtienen destacado + cero comisiones
            el primer mes
          </p>
          {sellerCount > 0 ? (
            <p className="mt-2 text-sm text-white/80">
              {sellerCount} profesional{sellerCount === 1 ? '' : 'es'} ya registrado
              {sellerCount === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold">Servicios populares que llegan a {country.name}</h2>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground">
            {country.categories.join(' • ')}
          </p>
          <Button
            className="mt-8 rounded-full bg-blue-600 px-6 py-3 hover:bg-blue-700"
            onClick={openPioneerDialog}
          >
            Registra tu servicio ahora
          </Button>
        </div>
      </section>

      <HomeFooter />

      <CountryIntentDialog
        open={dialogOpen}
        country={country}
        sellerCount={sellerCount}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
}