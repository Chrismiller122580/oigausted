'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import SessionExpiryHandler from "./SessionExpiryHandler";

export default function SessionProviderWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ThemeProvider>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
        <SessionExpiryHandler>
          {children}
        </SessionExpiryHandler>
      </SessionProvider>
    </ThemeProvider>
  );
}
