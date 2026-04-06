"use client"
import { SessionProvider } from "next-auth/react"
import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import GrokAssistant from "@/components/GrokAssistant"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Hide global navbar on auth pages AND all admin pages
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const isAdminPage = pathname.startsWith("/admin")

  const hideNavbar = isAuthPage || isAdminPage

  return (
    <SessionProvider>
      {!hideNavbar && <Navbar />}
      <main className={hideNavbar ? "min-h-screen" : "min-h-screen pt-16"}>
        {children}
      </main>
      {!hideNavbar && <GrokAssistant />}
    </SessionProvider>
  )
}
