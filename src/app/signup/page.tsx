"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer" as "buyer" | "seller"
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al crear la cuenta")
        setLoading(false)
        return
      }

      // Save to localStorage for current session
      localStorage.setItem("oigausted-user", JSON.stringify(data.user))

      alert(`¡Registro exitoso como ${formData.role === "buyer" ? "Comprador" : "Vendedor"}!`)

      if (formData.role === "seller") {
        router.push("/seller")
      } else {
        router.push("/")
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-10 shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-2 text-yellow-600">OigaUsted</h1>
        <p className="text-center text-gray-600 mb-8">Crea tu cuenta</p>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Nombre Completo</Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Juan Pérez"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label>Correo Electrónico</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@email.com"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label>Registrarme como</Label>
            <div className="flex gap-4 mt-3">
              <Button
                type="button"
                variant={formData.role === "buyer" ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, role: "buyer" })}
                className="flex-1 py-6"
              >
                Comprador
              </Button>
              <Button
                type="button"
                variant={formData.role === "seller" ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, role: "seller" })}
                className="flex-1 py-6"
              >
                Vendedor
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full py-6 text-lg bg-yellow-600 hover:bg-yellow-700"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-yellow-600 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
