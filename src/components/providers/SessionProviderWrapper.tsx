'use client';

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import SessionExpiryHandler from "./SessionExpiryHandler";
import { PlatformConfigProvider } from "./PlatformConfigProvider";
import RecordLogin from "@/components/auth/RecordLogin";
import PresenceHeartbeat from "@/components/auth/PresenceHeartbeat";
import CapacitorShellInit from "@/components/native/CapacitorShellInit";
import NativePushInit from "@/components/native/NativePushInit";
import AdminWidgetSync from "@/components/admin/AdminWidgetSync";


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
          <CapacitorShellInit />
          <NativePushInit />
          <AdminWidgetSync />

          <SessionExpiryHandler>
            {children}
          </SessionExpiryHandler>
        </PlatformConfigProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
