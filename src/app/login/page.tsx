"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Auto-redirect if already logged in
  useEffect(() => {
    if (session?.user) {
      const role = (session.user as any).role || "buyer"
      if (role === "admin") router.push("/admin")
      else if (role === "seller") router.push("/seller")
      else router.push("/buyer")
    }
  }, [session, router])

  const handleDemoLogin = async (demoEmail: string, demoRole: string) => {
    setLoading(true)
    setError("")

    try {
      // Use real NextAuth signIn with credentials for better session handling
      const res = await signIn("credentials", {
        email: demoEmail,
        password: "demo123", // dummy password - backend should accept demo accounts
        redirect: false,
      })

      if (res?.ok) {
        // Small delay to let session update
        setTimeout(() => {
          if (demoRole === "admin") router.push("/admin")
          else if (demoRole === "seller") router.push("/seller")
          else router.push("/buyer")
        }, 300)
      } else {
        setError("Demo login failed. Try again.")
      }
    } catch (err) {
      setError("Error during login")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.ok) {
        // Let useEffect handle redirect based on real session role
      } else {
        setError("Credenciales incorrectas. Usa las cuentas demo.")
      }
    } catch (err) {
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">¡Oiga Usted!</h1>
          <p className="text-gray-600 mt-3">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="mt-8">
          <p className="text-center text-sm text-gray-500 mb-4">Cuentas de prueba</p>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => handleDemoLogin("buyer@demo.com", "buyer")}
              disabled={loading}
            >
              👤 Entrar como Comprador
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => handleDemoLogin("seller@demo.com", "seller")}
              disabled={loading}
            >
              🛠️ Entrar como Vendedor
            </Button>
            <Button
              variant="default"
              className="justify-start h-auto py-4 bg-yellow-600 hover:bg-yellow-700"
              onClick={() => handleDemoLogin("admin@demo.com", "admin")}
              disabled={loading}
            >
              🔑 Entrar como Admin
            </Button>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="text-yellow-600 hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
