"use client"
import Link from "next/link"
import { ArrowLeft, Edit3, TrendingUp, MapPin, Phone } from "lucide-react"
import { useState } from "react"
import GrokAssistant from "@/components/GrokAssistant"

export default function BusinessProfile() {
  const [businessName, setBusinessName] = useState("Mi Negocio Local")
  const [description, setDescription] = useState("Ofrecemos servicios profesionales de limpieza, mantenimiento y eventos en Bucaramanga y alrededores con excelente atención al cliente.")
  const [phone, setPhone] = useState("+57 300 123 4567")
  const [location, setLocation] = useState("Bucaramanga, Santander")

  const rating = 4.8
  const reviewCount = 47
  const totalGigs = 23
  const totalEarnings = "8.450.000"

  const pastProjects = [
    { id: 1, title: "Limpieza profunda de oficina", date: "15 Mar 2026", price: 450000 },
    { id: 2, title: "DJ y sonido para boda", date: "8 Mar 2026", price: 1200000 },
    { id: 3, title: "Sesión fotográfica corporativa", date: "2 Mar 2026", price: 850000 },
  ]

  const handleSave = () => alert("✅ Información del negocio guardada correctamente")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/seller" 
            className="inline-flex items-center gap-3 text-gray-600 hover:text-yellow-600 font-medium text-lg"
          >
            <ArrowLeft size={24} />
            Volver al Dashboard
          </Link>
        </div>

        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Mi Negocio</h1>
          <button 
            onClick={handleSave}
            className="flex items-center gap-3 bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-4 rounded-2xl font-medium"
          >
            <Edit3 size={20} /> Guardar Cambios
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-8 bg-white rounded-3xl border p-10">
            <div className="flex gap-10">
              <div className="flex-shrink-0">
                <div className="w-44 h-44 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl flex items-center justify-center text-8xl shadow-inner">
                  🏪
                </div>
                <button className="mt-4 text-yellow-600 text-sm font-medium block w-full">Cambiar foto</button>
              </div>

              <div className="flex-1 space-y-8">
                <div>
                  <label className="block text-sm font-medium mb-3">Nombre del Negocio</label>
                  <input 
                    value={businessName} 
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-6 py-5 border border-gray-300 rounded-2xl focus:border-yellow-600 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Descripción del Negocio</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full px-6 py-5 border border-gray-300 rounded-2xl focus:border-yellow-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                      <Phone size={18} /> Teléfono de contacto
                    </label>
                    <input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-6 py-5 border border-gray-300 rounded-2xl focus:border-yellow-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                      <MapPin size={18} /> Ubicación
                    </label>
                    <input 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-6 py-5 border border-gray-300 rounded-2xl focus:border-yellow-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ratings & Stats */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-3xl border p-8">
              <h3 className="font-semibold text-xl mb-6">Tu Reputación</h3>
              <div className="flex items-center gap-6">
                <div className="text-7xl font-bold text-yellow-600">{rating}</div>
                <div>
                  <div className="flex text-4xl text-yellow-500">★★★★☆</div>
                  <p className="text-gray-600 mt-2">{reviewCount} reseñas</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border p-8">
              <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
                <TrendingUp size={24} /> Estadísticas
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gigs publicados</span>
                  <span className="font-semibold text-2xl">{totalGigs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ingresos totales</span>
                  <span className="font-semibold text-2xl">${totalEarnings}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Past Projects */}
          <div className="lg:col-span-12 bg-white rounded-3xl border p-10">
            <h3 className="font-semibold text-2xl mb-8">Proyectos Recientes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pastProjects.map((project) => (
                <div key={project.id} className="border rounded-3xl overflow-hidden">
                  <div className="h-52 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-7xl">
                    📸
                  </div>
                  <div className="p-6">
                    <h4 className="font-medium mb-1">{project.title}</h4>
                    <p className="text-xs text-gray-500 mb-4">{project.date}</p>
                    <div className="font-bold text-xl text-yellow-600">
                      ${project.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grok AI Assistant on Profile Page */}
      <GrokAssistant />
    </div>
  )
}
