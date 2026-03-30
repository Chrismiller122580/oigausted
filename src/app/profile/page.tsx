"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ToastProvider"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [myGigs, setMyGigs] = useState<any[]>([])
  const [myOrders, setMyOrders] = useState<any[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && session?.user) {
      const savedGigs = localStorage.getItem("oigausted-gigs")
      if (savedGigs) {
        const allGigs = JSON.parse(savedGigs)
        setMyGigs(allGigs.filter((g: any) => g.seller === session.user.name))
      }

      const savedOrders = localStorage.getItem("oigausted-orders")
      if (savedOrders) {
        const allOrders = JSON.parse(savedOrders)
        setMyOrders(allOrders)
      }
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div className="container py-20 text-center">Cargando perfil...</div>
  }

  if (!session) {
    return <div className="container py-20 text-center">Por favor inicia sesión</div>
  }

  return (
    <div className="container mx-auto py-12 px-6 max-w-5xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Bienvenido, {session.user.name}</p>
        </div>
        <Button onClick={() => router.push("/seller")}>Ir a Panel de Vendedor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link href="/gigs" className="block bg-white border rounded-3xl p-8 hover:shadow-xl transition-all text-center">
          <h3 className="font-semibold text-xl mb-2">Explorar Gigs</h3>
          <p className="text-gray-500">Buscar servicios locales</p>
        </Link>
        <Link href="/create-gig" className="block bg-white border rounded-3xl p-8 hover:shadow-xl transition-all text-center">
          <h3 className="font-semibold text-xl mb-2">Publicar Gig</h3>
          <p className="text-gray-500">Ofrece tus habilidades</p>
        </Link>
        <Link href="/profile" className="block bg-white border rounded-3xl p-8 hover:shadow-xl transition-all text-center border-yellow-500 bg-yellow-50">
          <h3 className="font-semibold text-xl mb-2">Mis Pedidos</h3>
          <p className="text-gray-500">Ver {myOrders.length} pedidos</p>
        </Link>
      </div>

      <div className="text-center text-sm text-gray-500 mt-12">
        Real database integration coming next.
      </div>
    </div>
  )
}
