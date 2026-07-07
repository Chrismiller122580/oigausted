import { NextResponse } from 'next/server';
import { requireAnalyticsPanelSession } from '@/lib/admin-auth';
import { authOptions } from '@/lib/auth';
import { getAnalyticsIntegrations } from '@/lib/admin-analytics';

export async function GET() {
  try {
    const session = await requireAnalyticsPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({ integrations: getAnalyticsIntegrations() });
  } catch (error) {
    console.error('Admin analytics integrations error:', error);
    return NextResponse.json({ error: 'Error obteniendo integraciones' }, { status: 500 });
  }
}