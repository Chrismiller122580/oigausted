"use client"
import Link from "next/link"
import * as LucideIcons from "lucide-react"
import { gigCategories } from "@/lib/gig-categories"

export default function CreateGigSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12">
      <div className="container max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">¿Qué servicio vas a ofrecer?</h1>
          <p className="text-xl text-gray-600">Elige la categoría que mejor describe tu gig</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {gigCategories.map((cat) => {
            // Dynamically get the Lucide icon component
            const IconComponent = (LucideIcons as any)[cat.icon] || LucideIcons.Star

            return (
              <Link 
                key={cat.slug} 
                href={`/create-gig/${cat.slug}`} 
                className="group"
              >
                <div className="bg-white border-2 border-transparent hover:border-yellow-500 rounded-3xl p-8 text-center transition-all hover:shadow-2xl hover:-translate-y-1 h-full flex flex-col">
                  <div className="text-5xl mb-6 text-yellow-600">
                    <IconComponent />
                  </div>
                  <h3 className="font-semibold text-xl group-hover:text-yellow-600 transition-colors mb-3">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3 flex-1">
                    {cat.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
