import { notFound, redirect } from 'next/navigation';
import { getCountry } from '@/lib/countries';
import { countActiveSellers } from '@/lib/country-stats';
import { CountryComingSoonView } from '@/components/marketing/CountryComingSoonView';
import { buildPublicPageMetadata } from '@/lib/public-site';

type CountryPageProps = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: CountryPageProps) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country || country.status === 'live') {
    return {};
  }

  return buildPublicPageMetadata({
    title: `OigaGIG ${country.name} • Próximamente`,
    description: `Gigs locales, profesionales de confianza y pagos con ${country.paymentLabel} en ${country.name}. Regístrate como pionero.`,
    path: `/${country.code}`,
    keywords: [
      `servicios locales ${country.name.toLowerCase()}`,
      `gigs ${country.name.toLowerCase()}`,
      'oigagig',
    ],
  });
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { country: code } = await params;
  const country = getCountry(code);

  if (!country) {
    notFound();
  }

  if (country.status === 'live') {
    redirect(country.livePath ?? '/');
  }

  const sellerCount = await countActiveSellers(country.code);

  return <CountryComingSoonView country={country} sellerCount={sellerCount} />;
}