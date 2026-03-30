import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import { ToastProvider } from "@/components/ToastProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OigaUsted - Gigs Colombia",
  description: "La plataforma de gigs y servicios locales más confiable de Colombia",
  icons: { icon: "/favicon.ico" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ToastProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="font-bold text-xl mb-4">OigaUsted</h3>
                  <p className="text-gray-400 text-sm">Conectando talento local en Colombia.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Plataforma</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><a href="/gigs" className="hover:text-white">Explorar Gigs</a></li>
                    <li><a href="/create-gig" className="hover:text-white">Publicar Gig</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Empresa</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><a href="#" className="hover:text-white">Sobre Nosotros</a></li>
                    <li><a href="#" className="hover:text-white">Blog</a></li>
                    <li><a href="#" className="hover:text-white">Contacto</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Legal</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><a href="#" className="hover:text-white">Términos</a></li>
                    <li><a href="#" className="hover:text-white">Privacidad</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
                © 2026 OigaUsted. Hecho con ❤️ en Bucaramanga, Colombia.
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  )
}
