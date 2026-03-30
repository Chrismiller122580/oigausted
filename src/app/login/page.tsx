"use client"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ToastProvider"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role || "buyer"
      if (role === "admin") router.push("/admin")
      else if (role === "seller") router.push("/seller")
      else router.push("/profile")
    }
  }, [session, status, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.ok) {
      showToast("Inicio de sesión exitoso", "success")
    } else {
      showToast("Email o contraseña incorrectos", "error")
    }

    setLoading(false)
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-yellow-600">OigaUsted</h1>
          <p className="text-gray-600 mt-3">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chris@demo.com"
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
            className="w-full py-6 text-lg" 
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Demo accounts:<br />
          chris@demo.com / 123 → Admin<br />
          buyer@demo.com / 123 → Buyer<br />
          seller@demo.com / 123 → Seller
        </div>
      </div>
    </div>
  )
}
