"use client"

import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <div className="container flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
          <p className="mt-2 text-muted-foreground">
            Ingresa con Google para comprar o vender gigs
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Continuar con Google
        </Button>
      </div>
    </div>
  )
}
