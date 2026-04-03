"use client"

import { SessionProvider } from "next-auth/react"
import { Navbar } from "@/components/Navbar"
import GrokAssistant from "@/components/GrokAssistant"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <GrokAssistant />
    </SessionProvider>
  )
}
