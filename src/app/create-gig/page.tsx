"use client"

import { Suspense } from "react"
import CreateGigForm from "./CreateGigForm"

export default function CreateGigPage() {
  return (
    <Suspense fallback={<div className="container py-12 text-center">Cargando formulario...</div>}>
      <CreateGigForm />
    </Suspense>
  )
}
