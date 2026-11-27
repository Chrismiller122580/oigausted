import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGigCategories } from '@/lib/categories'
import { listPublicGigs } from '@/lib/gig-queries'
import { buildLocalServiceMetadata, publicAbsoluteUrl } from '@/lib/seo-metadata'
import { categoryToSlug, slugToCategory, allCategorySlugs } from '@/lib/category-slug'
import { sanitizeStoredCity } from '@/lib/public-location'

export const revalidate = 60

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
  const slugs = allCategorySlugs(categories)
  // Major cities + common ones; dynamic params still work for others
  const cities = ['bucaramanga', 'bogota', 'medellin', 'cali', 'barranquilla', 'cartagena']
  const params: { slug: string; ciudad: string }[] = []
  for (const slug of slugs) {
    for (const city of cities) {
      params.push({ slug, ciudad: city })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; ciudad: string }>
}): Promise<Metadata> {
  const { slug, ciudad } = await params
  const categories = await getCategories()
  const category = slugToCategory(slug, categories)
  if (!category) {
    return { title: 'Categoría no encontrada | OigaGIG', robots: { index: false } }
  }
  const cityLabel = ciudad
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const title = `${category} en ${cityLabel} | OigaGIG`
  const description = `Encuentra ${category.toLowerCase()} en ${cityLabel} con profesionales locales. Chatea en la app y paga seguro con Wompi.`

  return buildLocalServiceMetadata({
    title,
    description,
    path: `/categorias/${slug}/${ciudad}`,
    keywords: [
      category.toLowerCase(),
      `${category.toLowerCase()} ${cityLabel.toLowerCase()}`,
      `servicios ${cityLabel.toLowerCase()}`,
      'oigagig',
    ],
  })
}

export default async function CategoryCityPage({ params }: { params: Promise<{ slug: string; ciudad: string }>) }) {
  const { slug, ciudad } = await params
  const categories = await getCategories()
  const category = slugToCategory(slug, categories)
  if (!category) notFound()

  const cityLabel = ciudad
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const { gigs, total } = await listPublicGigs({ category, city: cityLabel, limit: 100 })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category} en ${cityLabel} | OigaGIG`,
    description: `Servicios de ${category.toLowerCase()} en ${cityLabel}`,
    url: publicAbsoluteUrl(`/categorias/${slug}/${ciudad}`),
    areaServed: cityLabel,
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
        <Link href `/categorias/${slug}` className="hover:text-orange-500">{category}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{cityLabel}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          {category} en {cityLabel}
        </h1>
        <p className="mt-2 text-gray-600 max-w-2xl">
          Profesionales de {category.toLowerCase()} en {cityLabel}. Precios claros, chat en la app
          y pago seguro con Wompi.
        </p>
        <p className="mt-1 text-sm text-gray-500">{total} servicio{total === 1 ? '' : 's'} en {cityLabel}</p>
      </header>

      {gigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">
            Todavía no hay gigs de {category.toLowerCase()} en {cityLabel}.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            <Link href `/categorias/${slug}` className="text-orange-500 hover:underline">
              Ver {category.toLowerCase()} en otras ciudades
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
                <p className="mt-1 text-sm text-gray-500">{gig.city || cityLabel}</p>
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

      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        <Link
          href `/categorias/${slug}`
          className="inline-block px-6 py-3 rounded-lg border border-gray-200 text-gray-700 font-medium hover:border-orange-400 transition"
        >
          Ver {category} en todo Colombia
        </Link>
        <Link
          href `/gigs?categoria=${encodeURIComponent(category)}&ciudad=${encodeURIComponent(cityLabel)}`
          className="inline-block px-6 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
        >
          Ver en /gigs
        </Link>
      </div>
    </div>
  )
}
