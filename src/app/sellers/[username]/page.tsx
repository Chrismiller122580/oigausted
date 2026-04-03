"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Instagram, Facebook, Twitter, Globe, Star, Image } from "lucide-react"

export default function PublicSellerProfile() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const [sellerGigs, setSellerGigs] = useState<any[]>([])

  useEffect(() => {
    const savedProfile = localStorage.getItem("oigausted-seller-profile")
    if (savedProfile) {
      setSellerProfile(JSON.parse(savedProfile))
    }

    const savedGigs = localStorage.getItem("oigausted-gigs")
    if (savedGigs) {
      const allGigs = JSON.parse(savedGigs)
      const userGigs = allGigs.filter((g: any) => 
        g.seller.toLowerCase().replace(/\s+/g, '') === username.toLowerCase()
      )
      setSellerGigs(userGigs)
    }
  }, [username])

  if (!sellerProfile) {
    return <div className="container py-20 text-center">Cargando perfil del vendedor...</div>
  }

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <Button onClick={() => router.push("/gigs")} variant="outline" className="mb-8">
        ← Volver a Explorar Gigs
      </Button>

      <div className="bg-white border rounded-3xl p-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Profile Header */}
          <div className="md:w-80 flex-shrink-0 text-center">
            <div className="w-40 h-40 mx-auto rounded-2xl overflow-hidden border-4 border-white shadow-xl">
              {sellerProfile.logo ? (
                <img src={sellerProfile.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Star className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mt-6">Demo Vendedor</h1>
            <p className="text-gray-500">Vendedor Profesional en Colombia</p>

            <div className="flex justify-center gap-6 mt-8">
              {sellerProfile.socialInstagram && <a href={`https://instagram.com/${sellerProfile.socialInstagram}`} target="_blank" className="text-pink-600"><Instagram className="w-6 h-6" /></a>}
              {sellerProfile.socialFacebook && <a href={sellerProfile.socialFacebook} target="_blank" className="text-blue-600"><Facebook className="w-6 h-6" /></a>}
              {sellerProfile.socialTwitter && <a href={`https://twitter.com/${sellerProfile.socialTwitter}`} target="_blank" className="text-black"><Twitter className="w-6 h-6" /></a>}
              {sellerProfile.website && <a href={sellerProfile.website} target="_blank" className="text-gray-600"><Globe className="w-6 h-6" /></a>}
            </div>
          </div>

          {/* Bio and Portfolio */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-4">Sobre mí</h2>
            <p className="text-gray-700 leading-relaxed mb-10">
              {sellerProfile.bio || "Este vendedor aún no ha agregado una bio."}
            </p>

            {sellerProfile.portfolio && sellerProfile.portfolio.length > 0 && (
              <>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Image className="w-6 h-6" /> Portafolio / Muestras
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                  {sellerProfile.portfolio.map((img: string, index: number) => (
                    <div key={index} className="aspect-square border rounded-xl overflow-hidden">
                      <img src={img} alt="portfolio" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </>
            )}

            <h2 className="text-2xl font-semibold mb-6">Mis Servicios</h2>

            {sellerGigs.length === 0 ? (
              <p className="text-gray-500">Este vendedor aún no tiene gigs publicados.</p>
            ) : (
              <div className="grid gap-6">
                {sellerGigs.map((gig) => (
                  <div key={gig.id} className="border rounded-2xl p-6 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-xl">{gig.title}</h3>
                    <p className="text-2xl font-bold text-yellow-600 mt-2">${gig.price}</p>
                    {gig.completionTime && <p className="text-sm text-green-600 mt-1">⏱ {gig.completionTime}</p>}
                    <p className="text-sm text-gray-600 mt-4 line-clamp-3">{gig.description}</p>

                    <Button className="mt-6" asChild>
                      <Link href={`/gigs/${gig.id}`}>Ver Detalle del Gig</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
