import { Suspense } from 'react'
import GigsClient from './GigsClient'
import { listPublicGigs } from '@/lib/gig-queries'

export const revalidate = 60

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function GigsPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const sp = searchParams ? await searchParams : {}
  const pick = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }

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
