"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { toast } from 'react-hot-toast'
import { getAuthCallbackUrl } from "@/lib/getAuthCallbackUrl"

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

      toast.success(`¡Registro exitoso como ${formData.role === "buyer" ? "Comprador" : "Vendedor"}!`)

      // Auto sign-in so the user lands inside the app immediately
      const loginResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (loginResult?.ok) {
        // Route based on chosen role (use helper for dev resilience)
        if (formData.role === "seller") {
          router.push(getAuthCallbackUrl("/seller"))
        } else {
          router.push(getAuthCallbackUrl("/"))
        }
      } else {
        // Fallback: send them to login page
        router.push(getAuthCallbackUrl("/login"))
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        
        {/* Hero with Logo */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 sm:p-10 text-white text-center">
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo.png" 
              alt="Oiga Usted" 
              width={100} 
              height={100} 
              className="drop-shadow-lg"
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">¡Bienvenido!</h1>
          <p className="mt-2 text-white/90">Crea tu cuenta y comienza a conectar</p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {error && (
            <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-2xl">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Nombre Completo</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez"
                required
                className="mt-1.5 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com"
                required
                className="mt-1.5 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="mt-1.5 h-12 text-base"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Registrarme como</Label>
              <div className="flex gap-4 mt-3">
                <Button
                  type="button"
                  variant={formData.role === "buyer" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, role: "buyer" })}
                  className="flex-1 py-6 text-base"
                >
                  Comprador
                </Button>
                <Button
                  type="button"
                  variant={formData.role === "seller" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, role: "seller" })}
                  className="flex-1 py-6 text-base"
                >
                  Vendedor
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg bg-orange-600 hover:bg-orange-700 rounded-2xl font-semibold"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500 pt-2">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-orange-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
