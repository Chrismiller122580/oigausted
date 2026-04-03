"use client"

import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/ToastProvider"
import { Navbar } from "@/components/Navbar"

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </ToastProvider>
    </SessionProvider>
  )
}
