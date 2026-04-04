"use client"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
// ... rest of your existing create-gig code stays exactly the same ...

// Add this guard at the top of the component (after getting session)
export default function CreateGigByCategory() {
  const { category } = useParams() as { category: string }
  const router = useRouter()
  const { data: session } = useSession()

  const role = (session?.user as any)?.role

  useEffect(() => {
    if (role === "buyer") {
      router.push("/gigs")   // Buyers are redirected to browse
    }
  }, [role, router])

  // ... rest of your form code remains unchanged ...
}
