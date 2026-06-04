"use client"
import { SessionProvider } from "next-auth/react"

// @deprecated - unused duplicate of logic in layout.tsx / SessionProviderWrapper
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
