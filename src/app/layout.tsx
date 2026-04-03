import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NavbarWrapper } from "@/components/NavbarWrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OigaUsted - Gigs Colombia",
  description: "Plataforma de servicios freelance en Colombia",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <NavbarWrapper />
        <main>{children}</main>
      </body>
    </html>
  )
}
