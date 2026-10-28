import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestIp } from "@/lib/rate-limit";

const POLICY_VERSION = "2026-10-28";

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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        dataProcessingConsentAt: new Date(),
        dataProcessingConsentIp: ip || null,
        dataProcessingConsentVersion: version,
      },
    });

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { dataProcessingConsentAt: true },
    });

    return NextResponse.json({
      needsConsent: !user?.dataProcessingConsentAt,
    });
  } catch {
    return NextResponse.json({ needsConsent: false });
  }
}
