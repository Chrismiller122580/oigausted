"use client"
import { Button } from "@/components/ui/button"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/")
    }
  }, [session, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">¡Bienvenido a OigaUsted!</h1>
        <p className="text-center text-gray-600 mb-8">Ingresa con tu cuenta demo</p>
        
        <div className="space-y-4">
          <Button onClick={() => signIn("credentials", { email: "buyer@demo.com", password: "123", redirect: false })} className="w-full">
            Entrar como Comprador
          </Button>
          <Button onClick={() => signIn("credentials", { email: "seller@demo.com", password: "123", redirect: false })} variant="outline" className="w-full">
            Entrar como Vendedor
          </Button>
          <Button onClick={() => signIn("credentials", { email: "admin@demo.com", password: "123", redirect: false })} variant="outline" className="w-full">
            Entrar como Admin
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-8">Demo passwords: 123 for all accounts</p>
      </div>
    </div>
  )
}
