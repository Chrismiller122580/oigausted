import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/rate-limit";

const POLICY_VERSION = "2026-10-28";

async function ensureConsentColumns() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataProcessingConsentAt" TIMESTAMP(3)`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataProcessingConsentIp" TEXT`,
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dataProcessingConsentVersion" TEXT`,
  );
}

function isMissingConsentColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("dataProcessingConsent") || message.includes("P2022");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const version = typeof body.version === "string" ? body.version : POLICY_VERSION;
    const ip = getRequestIp(request.headers);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const save = () =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          dataProcessingConsentAt: new Date(),
          dataProcessingConsentIp: ip || null,
          dataProcessingConsentVersion: version,
        },
      });

    try {
      await save();
    } catch (error) {
      if (!isMissingConsentColumn(error)) throw error;
      console.warn("[consent] columns missing, adding them now");
      await ensureConsentColumns();
      await save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Consent update error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ needsConsent: false });
    }

    const read = () =>
      prisma.user.findUnique({
        where: { email: session.user.email },
        select: { dataProcessingConsentAt: true },
      });

    let user;
    try {
      user = await read();
    } catch (error) {
      if (!isMissingConsentColumn(error)) throw error;
      await ensureConsentColumns();
      user = await read();
    }

    return NextResponse.json({
      needsConsent: !user?.dataProcessingConsentAt,
    });
  } catch (error) {
    console.error("[consent] GET failed, requiring consent:", error);
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        return NextResponse.json({ needsConsent: true });
      }
    } catch {
      /* ignore */
    }
    return NextResponse.json({ needsConsent: false });
  }
}
