import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAnalyticsIntegrations } from '@/lib/admin-analytics';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ integrations: getAnalyticsIntegrations() });
  } catch (error) {
    console.error('Admin analytics integrations error:', error);
    return NextResponse.json({ error: 'Error obteniendo integraciones' }, { status: 500 });
  }
}