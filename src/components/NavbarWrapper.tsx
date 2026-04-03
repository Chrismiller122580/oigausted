"use client"

import { SessionProvider } from "next-auth/react"
import { Navbar } from "@/components/Navbar"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
    </SessionProvider>
  )
}
