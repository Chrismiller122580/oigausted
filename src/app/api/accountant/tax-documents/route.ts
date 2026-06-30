import { NextResponse } from 'next/server';
import { requireFinancePanelSession } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireFinancePanelSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const sellers = await prisma.user.findMany({
      where: { role: 'seller' },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        nit: true,
        payoutDocumentType: true,
        payoutDocumentNumber: true,
        payoutHolderName: true,
        payoutBankCode: true,
        payoutAccountNumber: true,
        payoutAccountType: true,
        createdAt: true,
      },
      orderBy: { businessName: 'asc' },
    });

    return NextResponse.json({ sellers });
  } catch (error) {
    console.error('Accountant tax documents error:', error);
    return NextResponse.json({ error: 'Failed to load tax documents' }, { status: 500 });
  }
}