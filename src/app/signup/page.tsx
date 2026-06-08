"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { toast } from 'sonner'
import { getAuthCallbackUrl } from "@/lib/getAuthCallbackUrl"
import { Eye, EyeOff } from "lucide-react"

function SignUpClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || searchParams.get('referral') || ''

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer" as "buyer" | "seller"
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [signupsEnabled, setSignupsEnabled] = useState(true);
  const [siteName, setSiteName] = useState('FitMe Live');

  // Check signup gate + Google OAuth + branding (from public admin config)
  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (typeof data.allowNewSignups === 'boolean') {
          setSignupsEnabled(data.allowNewSignups);
        }
        if (data.siteName) setSiteName(data.siteName);
        // Also load Google config
        fetch('/api/auth/config')
          .then(r => r.json())
          .then(g => setGoogleEnabled(g.googleEnabled ?? false))
          .catch(() => setGoogleEnabled(false));
      })
      .catch(() => {
        setSignupsEnabled(true); // fail open
      });
  }, []);

  // Handle NextAuth error redirects (e.g. ?error=OAuthSignin) also on signup
  useEffect(() => {
    const urlError = new URLSearchParams(window.location.search).get('error');
    if (urlError) {
      const friendlyMessage = 
        urlError === 'OAuthSignin' 
          ? 'Google sign-in failed. This is common in temporary dev environments (changing URLs). Try the email/password form instead.'
          : 'There was a problem signing in. Please try again.';
      
      setError(friendlyMessage);
      
      // Clean the URL
      window.history.replaceState({}, '', '/signup');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referralCode: refCode || undefined,
        }),
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

  const handleGoogleSignIn = async () => {
    const fromQuery = new URLSearchParams(window.location.search).get('callbackUrl');
    const callbackUrl = fromQuery || getAuthCallbackUrl('/');

    try {
      await signIn('google', { callbackUrl });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Error al registrarse con Google. Intenta con el formulario.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-card rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
        
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
          <h1 className="text-3xl sm:text-4xl font-bold">¡Bienvenido a {siteName}!</h1>
          <p className="mt-2 text-white/90">Crea tu cuenta y comienza a conectar</p>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {error && (
            <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-2xl">
              {error}
            </p>
          )}

          {!signupsEnabled && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm">
              <div className="font-semibold text-amber-700">Registros deshabilitados</div>
              <div className="text-amber-600 mt-1">El administrador ha cerrado temporalmente los nuevos registros en {siteName}. El formulario está deshabilitado.</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Nombre Completo</Label>
              <Input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Juan Pérez" required disabled={!signupsEnabled} className="mt-1.5 h-12 text-base" />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="tu@email.com" required disabled={!signupsEnabled} className="mt-1.5 h-12 text-base" />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" required disabled={!signupsEnabled} className="h-12 text-base pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={!signupsEnabled}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Registrarme como</Label>
              <div className="flex gap-4 mt-3">
                <Button type="button" variant={formData.role === "buyer" ? "default" : "outline"} onClick={() => setFormData({ ...formData, role: "buyer" })} className="flex-1 py-6 text-base" disabled={!signupsEnabled}>Comprador</Button>
                <Button type="button" variant={formData.role === "seller" ? "default" : "outline"} onClick={() => setFormData({ ...formData, role: "seller" })} className="flex-1 py-6 text-base" disabled={!signupsEnabled}>Vendedor</Button>
              </div>
            </div>
            <Button type="submit" className="w-full py-6 text-lg bg-orange-600 hover:bg-orange-700 rounded-2xl font-semibold" disabled={loading || !signupsEnabled}>
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          {googleEnabled && signupsEnabled && (
            <>
              <div className="my-6 relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">o</span></div>
              </div>
              <Button onClick={handleGoogleSignIn} variant="outline" className="w-full py-5 text-base flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.34z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Registrarme con Google
              </Button>
            </>
          )}

          <div className="text-center text-sm text-muted-foreground pt-2">
            ¿Ya tienes cuenta? <Link href="/login" className="text-orange-600 hover:underline font-medium">Inicia sesión</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Suspense wrapper for useSearchParams (ref code support) - fixes prod load errors
export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando formulario...</p>
        </div>
      </div>
    }>
      <SignUpClient />
    </Suspense>
  )
}
