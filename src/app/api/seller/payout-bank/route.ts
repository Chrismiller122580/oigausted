import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { devLog } from '@/lib/utils';

/**
 * Seller payout bank details (for receiving net seller payouts via Wompi or manual).
 * GET: return the current seller's saved bank info (sanitized).
 * POST/PATCH: save/update the bank fields (seller only).
 */

const ALLOWED_FIELDS = [
  'payoutBankCode',
  'payoutAccountNumber',
  'payoutAccountType',
  'payoutHolderName',
  'payoutDocumentType',
  'payoutDocumentNumber',
  'payoutPhone',
  'payoutEmail',
] as const;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    if (!userId || (role !== 'seller' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        payoutBankCode: true,
        payoutAccountNumber: true,
        payoutAccountType: true,
        payoutHolderName: true,
        payoutDocumentType: true,
        payoutDocumentNumber: true,
        payoutPhone: true,
        payoutEmail: true,
      },
    });

    return NextResponse.json({ bank: user || {} });
  } catch (e: any) {
    devLog('[payout-bank] GET error', e);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleSave(req);
}

export async function PATCH(req: NextRequest) {
  return handleSave(req);
}

async function handleSave(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    if (!userId || (role !== 'seller' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data: any = {};

    for (const f of ALLOWED_FIELDS) {
      if (body[f] !== undefined) {
        // Basic sanitization: trim strings, cap lengths
        let v = body[f];
        if (typeof v === 'string') v = v.trim().slice(0, 120);
        data[f] = v || null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        payoutBankCode: true,
        payoutAccountNumber: true,
        payoutAccountType: true,
        payoutHolderName: true,
        payoutDocumentType: true,
        payoutDocumentNumber: true,
      },
    });

    return NextResponse.json({ success: true, bank: updated });
  } catch (e: any) {
    devLog('[payout-bank] save error', e);
    return NextResponse.json({ error: 'Failed to save bank details' }, { status: 500 });
  }
}
