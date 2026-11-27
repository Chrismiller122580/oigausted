import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGigCategories } from '@/lib/categories'
import { listPublicGigs } from '@/lib/gig-queries'
import { buildLocalServiceMetadata, gigServiceJsonLd, publicAbsoluteUrl } from '@/lib/seo-metadata'
import { categoryToSlug, slugToCategory, allCategorySlugs } from '@/lib/category-slug'
import { BRAND_NAME } from '@/lib/brand'
import { PUBLIC_SITE_URL } from '@/lib/public-site'

export const revalidate = 60

const MAJOR_CITIES = ['Bucaramanga', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena']

async function getCategories(): Promise<string[]> {
  try {
    const cats = await getGigCategories()
    return cats.map((c) => c.name)
  } catch {
    const { gigCategories } = await import('@/lib/gig-categories')
    return gigCategories.map((c) => c.name)
  }
}

export async function generateStaticParams() {
  const categories = await getCategories()
  return allCategorySlugs(categories).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const categories = await getCategories()
  const category = slugToCategory(slug, categories)
  if (!category) {
    return { title: 'Categoría no encontrada | OigaGIG', robots: { index: false } }
  }

  const title = `${category} en Colombia | OigaGIG`
  const description = `Encuentra ${category.toLowerCase()} con profesionales locales en Colombia. Chatea en la app, compara precios y paga seguro con Wompi. Publica o contrata en minutos.`

  return buildLocalServiceMetadata({
    title,
    description,
    path: `/categorias/${slug}`,
    keywords: [
      category.toLowerCase(),
      `${category.toLowerCase()} colombia`,
      `${category.toLowerCase()} bucaramanga`,
      'servicios locales colombia',
      'oigagig',
      'marketplace colombia',
    ],
  })
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }>) }) {
  const { slug } = await params
  const categories = await getCategories()
  const category = slugToCategory(slug, categories)
  if (!category) notFound()

  const { gigs, total } = await listPublicGigs({ category, limit: 100 })

  // Collect cities that have gigs in this category
  const cityCounts = new Map<string, number>()
  for (const g of gigs) {
    const c = g.city?.trim()
    if (c) cityCounts.set(c, (cityCounts.get(c) || 0) + 1)
  }
  const citiesWithGigs = [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([city]) => city)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category} | OigaGIG`,
    description: `Servicios de ${category.toLowerCase()} en Colombia`,
    url: publicAbsoluteUrl(`/categorias/${slug}`),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: gigs.slice(0, 20).map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: publicAbsoluteUrl(`/gigs/${g.id}`),
        name: g.title,
      })),
    },
  }

  return (
    <div className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-orange-500">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/gigs" className="hover:text-orange-500">Servicios</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{category}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{category}</h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          Profesionales locales ofrecen {category.toLowerCase()} en Colombia. Compara precios,
          chatea directo y paga seguro con Wompi.
        </p>
        <p className="mt-1 text-sm text-gray-500">{total} servicio{total === 1 ? '' : 's'} disponible{total === 1 ? '' : 's'}</p>
      </header>

      {citiesWithGigs.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Por ciudad</h2>
          <div className="flex flex-wrap gap-2">
            {citiesWithGigs.map((city) => (
              <Link
                key={city}
                href `/categorias/${slug}/${categoryToSlug(city)}`
                className="px-3 py-1.5 rounded-full border border-gray-200 text-sm hover:border-orange-400 hover:text-orange-600 transition"
              >
                {city} ({cityCounts.get(city)})
              </Link>
            ))}
            {MAJOR_CITIES.filter((c) => !cityCounts.has(c)).map((city) => (
              <Link
                key={city}
                href `/categorias/${slug}/${categoryToSlug(city)}`
                className="px-3 py-1.5 rounded-full border border-dashed border-gray-200 text-sm text-gray-400 hover:border-orange-300 hover:text-orange-500 transition"
              >
                {city}
              </Link>
            ))}
          </div>
        </section>
      )}

      {gigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Todavía no hay gigs en esta categoría.</p>
          <p className="text-gray-400 text-sm mt-2">
            <Link href="/create-gig" className="text-orange-500 hover:underline">
              ¿Eres profesional? Publica el primero
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <Link
              key={gig.id}
              href `/gigs/${gig.id}`
              className="block rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-orange-300 transition group"
            >
              {gig.imageUrl && (
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  <img
                    src={gig.imageUrl}
                    alt={gig.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600">{gig.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{gig.city || 'Colombia'}</p>
                <p className="mt-2 text-lg font-bold text-orange-600">
                  ${gig.price.toLocaleString('es-CO')} COP
                </p>
                {gig.seller && (
                  <p className="mt-1 text-xs text-gray-400">
                    por {gig.seller.businessName || gig.seller.name}
                    {gig.seller.rating ? ` · ${gig.seller.rating.toFixed(1)} ★` : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href `/gigs?categoria=${encodeURIComponent(category)}`
          className="inline-block px-6 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
        >
          Ver todos en /gigs
        </Link>
      </div>
    </div>
  )
}
