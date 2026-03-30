import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import Providers from "@/components/Providers"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OigaUsted - Gigs Colombia",
  description: "La plataforma de gigs y servicios locales más confiable de Colombia",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <footer className="bg-gray-900 text-white py-12">
            <div className="container mx-auto px-6 text-center text-sm text-gray-500">
              © 2026 OigaUsted. Hecho con ❤️ en Bucaramanga, Colombia.
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
