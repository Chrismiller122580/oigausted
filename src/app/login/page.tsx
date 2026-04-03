"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session) {
      const role = (session.user as any)?.role
      if (role === "seller") router.push("/seller")
      else if (role === "admin") router.push("/admin")
      else router.push("/buyer")
    }
  }, [session, status, router])

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.ok) {
      // Redirect will be handled by useEffect
    } else {
      alert("Credenciales incorrectas. Prueba buyer@demo.com / 123 o seller@demo.com / 123")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-yellow-600">OigaUsted</h1>
          <p className="text-gray-600 mt-3">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Correo electrónico</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="buyer@demo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full py-7 text-lg bg-yellow-600 hover:bg-yellow-700"
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Credenciales de prueba:<br />
          Buyer: buyer@demo.com / 123<br />
          Seller: seller@demo.com / 123<br />
          Admin: admin@demo.com / 123
        </div>
      </div>
    </div>
  )
}
