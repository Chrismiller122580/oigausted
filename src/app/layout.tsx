import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OigaUsted",
  description: "Gigs Colombia",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <nav className="bg-white border-b p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <a href="/" className="text-2xl font-bold text-yellow-600">OigaUsted</a>
            <div className="flex gap-6 text-sm">
              <a href="/gigs" className="hover:text-yellow-600">Gigs</a>
              <a href="/create-gig" className="hover:text-yellow-600">Publicar</a>
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
