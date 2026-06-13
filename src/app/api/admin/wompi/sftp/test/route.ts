import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testWompiSftpConnection, getWompiSftpConfig } from '@/lib/wompi-sftp';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // Allow testing with provided creds without saving, or use saved config
    const config = body.host || body.username 
      ? {
          enabled: true,
          host: body.host,
          port: body.port || 22,
          username: body.username,
          password: body.password,
          privateKey: body.privateKey,
          remotePath: body.remotePath || '/',
        }
      : await getWompiSftpConfig();

    const result = await testWompiSftpConnection(config as any);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Test failed' }, { status: 500 });
  }
}