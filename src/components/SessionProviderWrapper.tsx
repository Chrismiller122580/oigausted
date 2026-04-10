"use client"
import { SessionProvider } from "next-auth/react"
import { useSession } from "next-auth/react"
import BuyerNavbar from "./BuyerNavbar"
import SellerNavbar from "./SellerNavbar"
import AdminNavbar from "./AdminNavbar"
import Navbar from "./Navbar"

export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavbarWithRole>
        {children}
      </NavbarWithRole>
    </SessionProvider>
  )
}

function NavbarWithRole({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  const role = (session?.user as any)?.role
  let CurrentNavbar = Navbar

  if (session) {
    if (role === "buyer") CurrentNavbar = BuyerNavbar
    else if (role === "seller") CurrentNavbar = SellerNavbar
    else if (role === "admin") CurrentNavbar = AdminNavbar
  }

  return (
    <>
      <CurrentNavbar />
      {children}
    </>
  )
}
