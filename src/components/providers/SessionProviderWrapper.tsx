'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import SessionExpiryHandler from "./SessionExpiryHandler";
import { PlatformConfigProvider } from "./PlatformConfigProvider";

export default function SessionProviderWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ThemeProvider>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
        <PlatformConfigProvider>
          <SessionExpiryHandler>
            {children}
          </SessionExpiryHandler>
        </PlatformConfigProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
