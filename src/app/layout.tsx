import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { NavbarWrapper } from "@/components/NavbarWrapper"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <NavbarWrapper />
        <main>{children}</main>
      </body>
    </html>
  )
}
