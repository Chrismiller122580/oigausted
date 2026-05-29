'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export default function SessionProviderWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ThemeProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
