"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ToastProvider"
import { useSession } from "next-auth/react"

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { showToast } = useToast()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [commissionRate, setCommissionRate] = useState(12)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role
      if (role !== "admin") {
        showToast("Acceso denegado. Solo administradores.", "error")
        router.push("/profile")
        return
      }
      setCurrentUser(session.user)
    }
  }, [session, status, router, showToast])

  if (status === "loading") {
    return <div className="container py-20 text-center">Cargando dashboard...</div>
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <div className="container py-20 text-center">Acceso denegado.</div>
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-10">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Bienvenido, {currentUser.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-xl font-semibold mb-6">Control de Comisiones</h2>
          <input 
            type="range" 
            min="5" 
            max="25" 
            value={commissionRate} 
            onChange={(e) => setCommissionRate(parseInt(e.target.value))}
            className="w-full accent-yellow-600"
          />
          <p className="text-6xl font-bold text-green-600 mt-6 text-center">{commissionRate}%</p>
        </div>

        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-xl font-semibold mb-6">Estadísticas</h2>
          <p className="text-gray-500">Más métricas vendrán pronto...</p>
        </div>
      </div>
    </div>
  )
}
