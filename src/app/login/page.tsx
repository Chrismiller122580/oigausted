"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ToastProvider"

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const demoUsers = [
      { email: "chris@demo.com", password: "123", name: "Chris Miller", role: "admin" },
      { email: "buyer@demo.com", password: "123", name: "Juan Comprador", role: "buyer" },
      { email: "seller@demo.com", password: "123", name: "Maria Vendedora", role: "seller" },
    ]

    const user = demoUsers.find(u => u.email === email && u.password === password)

    if (user) {
      const userData = {
        id: Date.now().toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isLoggedIn: true
      }
      localStorage.setItem("oigausted-user", JSON.stringify(userData))

      showToast(`✅ Bienvenido ${user.name} (${user.role})`, "success")

      // Redirect admin to admin dashboard, others to home
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } else {
      showToast("❌ Credenciales incorrectas. Prueba chris@demo.com / 123", "error")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border rounded-3xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
          <p className="text-gray-600 mt-2">Accede a tu cuenta de OigaUsted</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chris@demo.com"
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
              placeholder="123"
              required
            />
          </div>

          <Button type="submit" className="w-full py-6 text-lg" disabled={isLoading}>
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Usuarios de prueba:<br />
          chris@demo.com / 123 → Admin<br />
          buyer@demo.com / 123 → Buyer<br />
          seller@demo.com / 123 → Seller
        </div>
      </div>
    </div>
  )
}
