// src/app/(marketing)/gigs/page.tsx - Stable Gig Hub (Fixed for Next.js 16)
import Link from 'next/link';
import GigCard from '@/components/common/GigCard';
import { categories, categoryEmojis } from '@/lib/categories';
import { prisma } from '@/lib/prisma';
import GigsFilters from './GigsFilters';

export const revalidate = 60;

async function getGigs(categoria?: string, ciudad?: string) {
  const where: any = {};

  if (categoria) where.category = categoria;
  if (ciudad) where.location = { contains: ciudad, mode: 'insensitive' };

  const gigs = await prisma.gig.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      seller: { select: { name: true, businessName: true } }
    }
  });

  return gigs;
}

export default async function GigsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; ciudad?: string }>;
}) {
  const { categoria, ciudad } = await searchParams;   // ← Fixed: await the Promise

  const gigs = await getGigs(categoria, ciudad);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold">Gig Hub Colombia</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Encuentra profesionales locales • {gigs.length} gigs disponibles
          </p>
        </div>
        <Link
          href="/create-gig"
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2"
        >
          + Publicar nuevo gig
        </Link>
      </div>

      {/* Filters Client Component */}
      <GigsFilters 
        initialCategoria={categoria || ''} 
        initialCiudad={ciudad || ''} 
      />

      {/* Gigs Grid */}
      {gigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-zinc-500">No hay gigs disponibles aún</p>
          <p className="text-zinc-400 mt-2">¡Sé el primero en publicar uno!</p>
          <Link href="/create-gig" className="mt-6 inline-block bg-orange-600 text-white px-8 py-3 rounded-2xl">
            Publicar mi primer gig
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {gigs.map((gig: any) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}
