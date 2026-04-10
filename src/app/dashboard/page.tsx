"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.replace("/login")
      return
    }

    if (session.user?.role === "seller") {
      router.replace("/seller")
    } else if (session.user?.role === "buyer") {
      router.replace("/buyer")
    } else if (session.user?.role === "admin") {
      router.replace("/admin")
    } else {
      router.replace("/login")
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirigiendo según tu rol...</p>
    </div>
  )
}
