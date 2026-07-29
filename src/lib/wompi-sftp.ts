import { devLog } from './utils';
import type SftpClientType from 'ssh2-sftp-client';
import type { ConnectOptions, FileInfo } from 'ssh2-sftp-client';

// Lazy load ssh2-sftp-client only on server (avoids webpack native module issues in Next.js build)
type SftpClientConstructor = new (name?: string) => SftpClientType;
let SftpClient: SftpClientConstructor | null = null;

async function getSftpClient(): Promise<SftpClientType> {
  if (!SftpClient) {
    const mod = await import('ssh2-sftp-client');
    SftpClient = (mod.default || mod) as SftpClientConstructor;
  }
  return new SftpClient();
}

function buildConnectOptions(sftpConfig: WompiSftpConfig): ConnectOptions {
  const connectOptions: ConnectOptions = {
    host: sftpConfig.host,
    port: sftpConfig.port,
    username: sftpConfig.username,
  };

  if (sftpConfig.privateKey) {
    connectOptions.privateKey = sftpConfig.privateKey;
  } else if (sftpConfig.password) {
    connectOptions.password = sftpConfig.password;
  }

  return connectOptions;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export interface WompiSftpConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  remotePath?: string;
}

export async function getWompiSftpConfig(): Promise<WompiSftpConfig> {
  // Use the safe getPlatformConfig (which uses explicit select omitting sftp fields if necessary)
  // then fallback to env. This avoids prisma errors on missing columns.
  const { getPlatformConfig } = await import('@/lib/prisma');
  const config = await getPlatformConfig().catch(() => null);

  const enabled = config?.wompiSftpEnabled ?? (process.env.WOMPI_SFTP_ENABLED === 'true');
  const host = config?.wompiSftpHost || process.env.WOMPI_SFTP_HOST;
  const port = config?.wompiSftpPort || (process.env.WOMPI_SFTP_PORT ? parseInt(process.env.WOMPI_SFTP_PORT) : 22);
  const username = config?.wompiSftpUsername || process.env.WOMPI_SFTP_USERNAME;
  const password = config?.wompiSftpPassword || process.env.WOMPI_SFTP_PASSWORD;
  const privateKey = config?.wompiSftpPrivateKey || process.env.WOMPI_SFTP_PRIVATE_KEY;
  const remotePath = config?.wompiSftpRemotePath || process.env.WOMPI_SFTP_REMOTE_PATH || '/';

  return {
    enabled,
    host,
    port,
    username,
    password,
    privateKey,
    remotePath,
  };
}

export async function testWompiSftpConnection(config?: WompiSftpConfig): Promise<{ success: boolean; message: string; files?: string[] }> {
  const sftpConfig = config || await getWompiSftpConfig();

  if (!sftpConfig.enabled || !sftpConfig.host || !sftpConfig.username) {
    return { success: false, message: 'SFTP not enabled or missing host/username' };
  }

  const client = await getSftpClient();
  try {
    if (!sftpConfig.privateKey && !sftpConfig.password) {
      return { success: false, message: 'No password or private key provided' };
    }

    await client.connect(buildConnectOptions(sftpConfig));

    const testPath = sftpConfig.remotePath || '/';
    const list = await client.list(testPath);

    const fileNames = list.slice(0, 5).map((item: FileInfo) => item.name); // sample

    await client.end();

    return {
      success: true,
      message: `Connected successfully to ${sftpConfig.host}:${sftpConfig.port}. Found ${list.length} items in ${testPath}.`,
      files: fileNames,
    };
  } catch (error: unknown) {
    devLog('[Wompi SFTP] Test connection error:', error);
    try { await client.end(); } catch {}

    let msg = getErrorMessage(error);

    if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      msg = `DNS lookup failed for host "${sftpConfig.host}". The hostname could not be resolved from the server. ` +
            `Verify the exact Host Wompi provided in your dashboard for this commerce (placeholders like sftp.wompi.co may not be active until SFTP is fully enabled). ` +
            `Test the same Host + Username + Private Key from your local computer using any SFTP client (FileZilla, Cyberduck, WinSCP, or command-line sftp). ` +
            `If it works locally but not here, Wompi may require whitelisting your hosting provider's outbound IPs (e.g. Vercel IPs).`;
    } else if (msg.includes('authentication') || msg.includes('Permission denied') || msg.includes('all keys failed')) {
      msg = `Authentication failed for user "${sftpConfig.username}". ` +
            `Double-check the username, that you pasted the FULL private key content (including -----BEGIN ... and -----END lines), and that the key matches what you attached/generated in the Wompi SFTP setup for this account. No passphrase is supported.`;
    } else if (msg.includes('ECONNREFUSED')) {
      msg = `Connection refused to ${sftpConfig.host}:${sftpConfig.port}. Check the port (usually 22 for SFTP) and that SFTP access is enabled in your Wompi account.`;
    }

    return { success: false, message: `Connection failed: ${msg}` };
  }
}

export async function listWompiSftpFiles(remotePath?: string): Promise<FileInfo[]> {
  const sftpConfig = await getWompiSftpConfig();
  if (!sftpConfig.enabled || !sftpConfig.host) {
    throw new Error('SFTP not configured');
  }

  const client = await getSftpClient();
  try {
    await client.connect(buildConnectOptions(sftpConfig));

    const path = remotePath || sftpConfig.remotePath || '/';
    const files = await client.list(path);

    await client.end();
    return files;
  } catch (error) {
    try { await client.end(); } catch {}
    throw error;
  }
}

export async function downloadWompiSftpFile(remoteFilePath: string): Promise<Buffer> {
  const sftpConfig = await getWompiSftpConfig();
  if (!sftpConfig.enabled || !sftpConfig.host) {
    throw new Error('SFTP not configured');
  }

  const client = await getSftpClient();
  try {
    await client.connect(buildConnectOptions(sftpConfig));

    const buffer = await client.get(remoteFilePath) as Buffer;

    await client.end();
    return buffer;
  } catch (error) {
    try { await client.end(); } catch {}
    throw error;
  }
}

// Basic sync: download latest settlement-like files and log/process
export async function syncWompiSftpReports(): Promise<{ success: boolean; message: string; downloaded?: string[] }> {
  const sftpConfig = await getWompiSftpConfig();
  if (!sftpConfig.enabled) {
    return { success: false, message: 'SFTP disabled in config' };
  }

  try {
    const files = await listWompiSftpFiles();
    // Filter for common report names (adjust based on actual Wompi files: e.g. settlement, daily, payout)
    const reportFiles = files
      .filter((f: FileInfo) => f.type === '-' && (f.name.includes('settlement') || f.name.includes('report') || f.name.includes('payout') || f.name.includes('transacciones')))
      .sort((a: FileInfo, b: FileInfo) => (b.modifyTime || 0) - (a.modifyTime || 0))
      .slice(0, 3); // latest 3

    const downloaded: string[] = [];

    for (const file of reportFiles) {
      const fullPath = (sftpConfig.remotePath || '/') + (sftpConfig.remotePath?.endsWith('/') ? '' : '/') + file.name;
      const buffer = await downloadWompiSftpFile(fullPath);
      
      // CSV settlement parse not implemented — download + preview only (do not claim payouts reconciled)
      const contentPreview = buffer.toString('utf8').slice(0, 500);
      devLog(`[Wompi SFTP] Downloaded ${file.name} (${buffer.length} bytes). Preview:\n${contentPreview}`);

      downloaded.push(file.name);
    }

    return {
      success: true,
      // Honest ops messaging: files pulled, not order payouts updated
      message: `Descargados ${downloaded.length} archivo(s) de reporte (solo descarga; reconciliación de pagos no implementada).`,
      downloaded,
      mode: 'download_only' as const,
      parsed: false,
    };
  } catch (error: unknown) {
    devLog('[Wompi SFTP] Sync error:', error);
    return { success: false, message: getErrorMessage(error) || 'Sync failed' };
  }
}