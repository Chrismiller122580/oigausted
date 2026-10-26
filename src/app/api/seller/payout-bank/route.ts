import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getPlatformConfig } from '@/lib/prisma';
import { DEFAULT_PAYOUT_CONFIG } from '@/lib/payout';
import { devLog } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

/**
 * Seller payout destination (bank or Nequi). Used only for seller payouts.
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

function cleanNequi(value: unknown) {
  return String(value || '').replace(/\D/g, '');
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const role = session?.user?.role;
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

    const config = await getPlatformConfig();
    return NextResponse.json({
      bank: user || {},
      rates: {
        platformCommissionRate: config?.commissionRate ?? DEFAULT_PAYOUT_CONFIG.platformCommissionRate,
        referralCommissionRate: config?.referralCommissionRate ?? DEFAULT_PAYOUT_CONFIG.referralCommissionRate,
      },
    });
  } catch (e: unknown) {
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
    const userId = session?.user?.id;
    const role = session?.user?.role;
    if (!userId || (role !== 'seller' && role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data: Prisma.UserUpdateInput = {};

    for (const f of ALLOWED_FIELDS) {
      if (body[f] !== undefined) {
        let v = body[f];
        if (typeof v === 'string') v = v.trim().slice(0, 120);
        data[f] = v || null;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const isNequi = String(data.payoutBankCode || body.payoutBankCode || '').toUpperCase() === 'NEQUI';
    if (isNequi) {
      const nequi = cleanNequi(data.payoutAccountNumber || body.payoutAccountNumber);
      if (!/^3\d{9}$/.test(nequi)) {
        return NextResponse.json(
          { error: 'El número Nequi debe ser un celular colombiano de 10 dígitos, que empiece por 3' },
          { status: 400 }
        );
      }
      data.payoutBankCode = 'NEQUI';
      data.payoutAccountType = 'NEQUI';
      data.payoutAccountNumber = nequi;
      data.payoutPhone = nequi;
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
  } catch (e: unknown) {
    devLog('[payout-bank] save error', e);
    return NextResponse.json({ error: 'Failed to save payout details' }, { status: 500 });
  }
}
