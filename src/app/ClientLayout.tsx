"use client"
import { SessionProvider } from "next-auth/react"
import NavbarWrapper from "@/components/layout/NavbarWrapper"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <NavbarWrapper>
        <main className="min-h-screen">
          {children}
        </main>
      </NavbarWrapper>
    </SessionProvider>
  )
}
