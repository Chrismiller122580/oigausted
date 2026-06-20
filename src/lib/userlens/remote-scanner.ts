import '@/lib/userlens/server-only';
import type { UserLensScanRequest, UserLensScanResult } from '@/types/userlens';

export async function runRemoteUserLensScan(
  request: UserLensScanRequest,
): Promise<UserLensScanResult> {
  const baseUrl = process.env.USERLENS_REMOTE_SCANNER_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('USERLENS_REMOTE_SCANNER_URL is not configured');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = process.env.USERLENS_REMOTE_SCANNER_SECRET?.trim();
  if (secret) headers.Authorization = `Bearer ${secret}`;

  const response = await fetch(`${baseUrl}/api/scan`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Remote scanner failed');
  }

  return data as UserLensScanResult;
}