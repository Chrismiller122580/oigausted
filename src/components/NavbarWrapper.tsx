'use client';

import { SessionProvider } from "next-auth/react"
import { Navbar } from "./Navbar"

export function NavbarWrapper() {
  return (
    <SessionProvider>
      <Navbar />
    </SessionProvider>
  )
}
