import { listPublicGigs } from '@/lib/gig-queries';
import { buildGigMapPins, groupGigsByCity } from '@/lib/gig-map';
import { buildPublicPageMetadata } from '@/lib/public-site';
import { MapaPageClient } from './MapaPageClient';

export const metadata = buildPublicPageMetadata({
  title: 'Mapa de servicios en Colombia • OigaGig',
  description:
    'Explora gigs y servicios locales en el mapa de Colombia. Bogotá, Medellín, Cali y más ciudades con profesionales verificados.',
  path: '/mapa',
  keywords: ['mapa servicios colombia', 'gigs bogotá', 'profesionales locales', 'oigagig mapa'],
});

export const revalidate = 60;

export default async function MapaPage() {
  const { gigs } = await listPublicGigs({ limit: 500 });
  const pins = buildGigMapPins(gigs);
  const clusters = groupGigsByCity(pins);

  return <MapaPageClient pins={pins} clusters={clusters} cityCount={clusters.length} />;
}