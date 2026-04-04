"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminRedirect() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    const role = (session?.user as any)?.role
    if (role !== "admin") {
      router.push("/")
    }
  }, [session, router])

  return <div className="min-h-screen flex items-center justify-center">Verificando acceso...</div>
}
