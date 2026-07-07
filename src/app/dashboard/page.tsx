"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { getPostLoginRedirectPath } from "@/lib/session"

export default function DashboardRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.replace("/login")
      return
    }

    router.replace(getPostLoginRedirectPath(session))
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirigiendo según tu rol...</p>
    </div>
  )
}
