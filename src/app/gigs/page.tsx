import { Suspense } from 'react'
import GigsClient from './GigsClient'
import { listPublicGigs } from '@/lib/gig-queries'

export const revalidate = 60

export default async function GigsPage() {
  const { gigs } = await listPublicGigs({ limit: 100 })

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