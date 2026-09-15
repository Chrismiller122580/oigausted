import { Suspense } from 'react'
import type { Metadata } from 'next'
import GigsClient from './GigsClient'
import { listPublicGigs } from '@/lib/gig-queries'
import { buildLocalServiceMetadata } from '@/lib/seo-metadata'

export const revalidate = 60

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function pickParam(sp: Record<string, string | string[] | undefined>, k: string) {
  const v = sp[k]
  return Array.isArray(v) ? v[0] : v
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParams
}): Promise<Metadata> {
  const sp = searchParams ? await searchParams : {}
  const category = pickParam(sp, 'categoria')?.trim()
  const city = pickParam(sp, 'ciudad')?.trim()
  const q = pickParam(sp, 'q')?.trim()

  const where = [category, city].filter(Boolean).join(' en ')
  const title = where
    ? `${where} | Servicios locales OigaGIG`
    : q
      ? `${q} | Servicios en OigaGIG`
      : 'Servicios locales en Colombia | OigaGIG'
  const description = where
    ? `Encuentre ${category || 'servicios'} ${city ? `en ${city}` : 'en Colombia'} con profesionales locales, chat en la app y pago seguro con Wompi.`
    : 'Explore gigs de plomería, limpieza, belleza, técnicos y más en Bucaramanga, Bogotá, Medellín, Cali y toda Colombia. Ver el gig primero, comprar cuando esté listo.'

  const params = new URLSearchParams()
  if (category) params.set('categoria', category)
  if (city) params.set('ciudad', city)
  if (q) params.set('q', q)
  const qs = params.toString()

  return buildLocalServiceMetadata({
    title,
    description,
    path: qs ? `/gigs?${qs}` : '/gigs',
    keywords: [
      'servicios locales colombia',
      'gigs bucaramanga',
      'plomero bucaramanga',
      'limpieza bogotá',
      category || '',
      city || '',
      'oigagig',
    ].filter(Boolean),
  })
}

export default async function GigsPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const sp = searchParams ? await searchParams : {}
  const pick = (k: string) => pickParam(sp, k)

  const { gigs } = await listPublicGigs({
    limit: 100,
    q: pick('q'),
    category: pick('categoria'),
    city: pick('ciudad'),
    remoteOnly: pick('remote') === '1',
  })

  return (
    <Suspense
      fallback={
        <div className="container py-20 text-center">
          <p className="text-xl text-gray-500">Cargando servicios...</p>
        </div>
      }
    >
      <GigsClient initialGigs={gigs} />
    </Suspense>
  )
}
