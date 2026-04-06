"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    const role = (session?.user as any)?.role || 
                 JSON.parse(localStorage.getItem("oigausted-user") || "{}").role

    if (role !== "admin") {
      router.push("/login")
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Verificando acceso de administrador...</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {children}
    </div>
  )
}
