"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { categories } from "@/lib/categories"

export default function CreateGigSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">¿Qué servicio vas a ofrecer?</h1>
          <p className="text-xl text-gray-600">Elige la categoría que mejor describe tu gig</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/create-gig/${cat.slug}`} className="group">
              <div className="bg-white border-2 border-transparent hover:border-yellow-500 rounded-3xl p-8 text-center transition-all hover:shadow-2xl hover:-translate-y-1">
                <h3 className="font-semibold text-xl group-hover:text-yellow-600 transition-colors">{cat.name}</h3>
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
