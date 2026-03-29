import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <nav className="border-b bg-white p-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <a href="/" className="text-2xl font-bold text-yellow-600">OigaUsted</a>
            <div className="flex gap-8 text-sm font-medium">
              <a href="/gigs" className="hover:text-yellow-600">Explorar Gigs</a>
              <a href="/create-gig" className="hover:text-yellow-600">Publicar Gig</a>
            </div>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
