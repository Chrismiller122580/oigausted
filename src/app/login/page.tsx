"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
      const res = await signIn("credentials", {
        email: demoEmail,
        password: "demo123",
        redirect: false,
      })
      if (res?.ok) {
        setTimeout(() => {
          if (demoRole === "admin") router.push("/admin")
          else if (demoRole === "seller") router.push("/seller")
          else router.push("/buyer")
        }, 300)
      } else {
        setError("Demo login failed.")
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
      const res = await signIn("credentials", { email, password, redirect: false })
      if (!res?.ok) setError("Credenciales incorrectas.")
    } catch (err) {
      setError("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-10 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-5xl font-black">O</div>
          </div>
          <h1 className="text-4xl font-bold">¡Oiga Usted!</h1>
          <p className="mt-2 text-white/90">Conecta con servicios locales de Colombia</p>
        </div>

        <div className="p-10 space-y-8">
          {/* Prominent Google Button */}
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full py-7 text-lg font-semibold bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 flex items-center justify-center gap-3 shadow-md rounded-2xl"
          >
            <FcGoogle className="text-3xl" />
            Continuar con Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">o usa tu correo</span>
            </div>
          </div>

          {/* Traditional Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <Button type="submit" className="w-full py-6 text-lg bg-orange-600 hover:bg-orange-700 rounded-2xl" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div>
            <p className="text-center text-sm text-gray-500 mb-4">Cuentas de prueba</p>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-start h-auto py-4" onClick={() => handleDemoLogin("buyer@demo.com", "buyer")} disabled={loading}>
                👤 Entrar como Comprador
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4" onClick={() => handleDemoLogin("seller@demo.com", "seller")} disabled={loading}>
                🛠️ Entrar como Vendedor
              </Button>
              <Button variant="default" className="justify-start h-auto py-4 bg-yellow-600 hover:bg-yellow-700" onClick={() => handleDemoLogin("admin@demo.com", "admin")} disabled={loading}>
                🔑 Entrar como Admin
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="text-orange-600 hover:underline font-medium">Regístrate aquí</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
