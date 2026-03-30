import { Suspense } from "react"
import GigsContent from "./GigsContent"

export default function GigsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-12 px-6 text-center">
        <p className="text-xl">Cargando gigs...</p>
      </div>
    }>
      <GigsContent />
    </Suspense>
  )
}
