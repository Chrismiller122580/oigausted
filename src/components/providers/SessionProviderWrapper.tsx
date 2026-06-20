'use client';

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import SessionExpiryHandler from "./SessionExpiryHandler";
import { PlatformConfigProvider } from "./PlatformConfigProvider";

export default function SessionProviderWrapper({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <ThemeProvider>
      <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus>
        <PlatformConfigProvider>
          <SessionExpiryHandler>
            {children}
          </SessionExpiryHandler>
        </PlatformConfigProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
