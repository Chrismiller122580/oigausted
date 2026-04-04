"use client"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function BuyerProfile() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSwitchToSeller = async () => {
    // Update role (demo mode)
    await signIn("credentials", { email: session?.user?.email, password: "123", role: "seller", redirect: false })
    router.push("/seller")
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Mi Perfil de Comprador</h1>
      <div className="bg-white border rounded-3xl p-8">
        <Button onClick={handleSwitchToSeller} className="w-full mb-6">
          Cambiar a Modo Vendedor
        </Button>
        {/* Rest of buyer dashboard content */}
      </div>
    </div>
  )
}
