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

    // Safe type cast for role
    const role = session.user.role || "buyer"

    if (role === "seller") {
      router.replace("/seller")
    } else if (role === "buyer") {
      router.replace("/buyer")
    } else if (role === "admin") {
      router.replace("/admin")
    } else if (role === "accountant") {
      router.replace("/accountant")
    } else if (role === "admin_assistant") {
      router.replace("/admin-assistant")
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
