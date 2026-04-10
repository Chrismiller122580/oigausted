import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import NavbarWrapper from "@/components/layout/NavbarWrapper"
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OigaUsted - Gigs Colombia",
  description: "Plataforma de gigs y servicios locales en Colombia",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Skip NavbarWrapper only for admin routes
  const isAdminRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProviderWrapper>
          {!isAdminRoute && (
            // Buyer, Seller, and public pages use the smart NavbarWrapper
            <NavbarWrapper>
              {children}
            </NavbarWrapper>
          )}
          {isAdminRoute && (
            // Admin pages skip the wrapper and use only AdminNavbar from their layout
            children
          )}
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
