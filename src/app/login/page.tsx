"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import Image from 'next/image'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await signIn("credentials", { 
        email, 
        password, 
        redirect: false 
      })
      if (!res?.ok) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.")
      }
    } catch (err) {
      setError("Error al iniciar sesión. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Hero with New Logo */}
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
          <h1 className="text-3xl sm:text-4xl font-bold">¡Oiga Usted!</h1>
          <p className="mt-2 text-white/90 text-base sm:text-lg">Conecta con servicios locales de Colombia</p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full py-6 sm:py-7 text-base sm:text-lg font-semibold bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 flex items-center justify-center gap-3 shadow-md rounded-2xl"
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
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
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                className="mt-1.5 h-12 text-base"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-2xl">
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-orange-600 hover:bg-orange-700 rounded-2xl font-semibold" 
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500 pt-2">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="text-orange-600 hover:underline font-medium">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
