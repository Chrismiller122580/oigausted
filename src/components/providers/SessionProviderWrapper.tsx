'use client';

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import SessionExpiryHandler from "./SessionExpiryHandler";
import { PlatformConfigProvider } from "./PlatformConfigProvider";
import RecordLogin from "@/components/auth/RecordLogin";
import PresenceHeartbeat from "@/components/auth/PresenceHeartbeat";

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
          <RecordLogin />
          <PresenceHeartbeat />
          <SessionExpiryHandler>
            {children}
          </SessionExpiryHandler>
        </PlatformConfigProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
