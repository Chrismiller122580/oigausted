import { HomeNavbar } from '@/components/homepage/HomeNavbar';
import { HomeFooter } from '@/components/homepage/HomeFooter';
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

  return (
    <>
      <HomeNavbar />
      <main className="min-h-screen bg-background">
        <div className="bg-gradient-to-br from-sky-600 to-orange-700 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              Servicios en Colombia
            </h1>
            <p className="mt-3 text-base sm:text-lg text-white/90 max-w-2xl">
              Descubre dónde están los profesionales de OigaGig. Acércate a tu ciudad y haz clic en un pin para ver el servicio.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
          <MapaPageClient pins={pins} clusters={clusters} cityCount={clusters.length} />
        </div>
      </main>
      <HomeFooter />
    </>
  );
}