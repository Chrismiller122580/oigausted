import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testWompiSftpConnection, getWompiSftpConfig } from '@/lib/wompi-sftp';
import { isSecretUnchanged } from '@/lib/secrets';
import type { WompiSftpConfig } from '@/lib/wompi-sftp';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const saved = await getWompiSftpConfig();

    // Allow testing with provided creds without saving; fall back to stored secrets when masked
    const config = body.host || body.username
      ? {
          enabled: true,
          host: body.host,
          port: body.port || 22,
          username: body.username,
          password: isSecretUnchanged(body.password) ? saved?.password : body.password,
          privateKey: isSecretUnchanged(body.privateKey) ? saved?.privateKey : body.privateKey,
          remotePath: body.remotePath || '/',
        }
      : saved;

    const result = await testWompiSftpConnection(config as WompiSftpConfig);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Test failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}