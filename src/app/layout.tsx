import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

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
    <html lang="es">
      <body className={inter.className}>
        <nav className="border-b bg-white p-4">
          <div className="container flex justify-between items-center">
            <a href="/" className="font-bold text-2xl text-yellow-600">OigaUsted</a>
            <div className="flex gap-6">
              <a href="/gigs" className="hover:text-yellow-600">Gigs</a>
              <a href="/create-gig" className="hover:text-yellow-600">Publicar</a>
              <a href="/profile" className="hover:text-yellow-600">Perfil</a>
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
