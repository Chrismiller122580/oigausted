"use client"
import { useState, useEffect } from "react"
import GigCard from "@/components/GigCard"

const mockGigs = [
  { id: "g1", title: "Diseño de Logo Profesional", price: 85000, category: "diseño", seller: "Ana Seller", description: "Logo moderno para tu negocio" },
  { id: "g2", title: "Limpieza General de Hogar", price: 65000, category: "limpieza", seller: "Demo Vendedor", description: "Limpieza profunda" },
  { id: "g3", title: "Cocina Casera para Eventos", price: 120000, category: "cocina", seller: "Ana Seller", description: "Comida típica colombiana" },
  { id: "g4", title: "Música en Vivo para Fiestas", price: 180000, category: "música", seller: "Demo Vendedor", description: "DJ o banda" },
  { id: "g5", title: "Fotografía Profesional", price: 95000, category: "fotografía", seller: "Ana Seller", description: "Sesiones y eventos" },
  { id: "g6", title: "Asesoría Legal y Tributaria", price: 150000, category: "legal", seller: "Demo Vendedor", description: "Consultoría para pymes" },
  { id: "g7", title: "Transporte y Logística", price: 80000, category: "transporte", seller: "Ana Seller", description: "Mudanzas y envíos" },
  { id: "g8", title: "Eventos y Organización", price: 250000, category: "eventos", seller: "Demo Vendedor", description: "Bodas y fiestas" }
]

export default function GigsPage() {
  const [gigs, setGigs] = useState(mockGigs)

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Explorar Gigs en Colombia</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
      </div>
    </div>
  )
}
