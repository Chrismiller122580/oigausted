import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/layout/NavbarWrapper";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OigaUsted - Gigs Colombia",
  description: "Plataforma de gigs y servicios locales en Colombia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Wompi Checkout Script - loads only when needed */}
        <script
          src="https://checkout.wompi.co/widget.js"
          async
        />
      </head>
      <body className={inter.className}>
        <SessionProviderWrapper>
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
