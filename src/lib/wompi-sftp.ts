import { devLog } from './utils';
import { prisma } from './prisma';

// Lazy load ssh2-sftp-client only on server (avoids webpack native module issues in Next.js build)
let SftpClient: any;
async function getSftpClient() {
  if (!SftpClient) {
    const mod = await import('ssh2-sftp-client');
    SftpClient = mod.default || mod;
  }
  return new SftpClient();
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
    const connectOptions: any = {
      host: sftpConfig.host,
      port: sftpConfig.port,
      username: sftpConfig.username,
    };

    if (sftpConfig.privateKey) {
      connectOptions.privateKey = sftpConfig.privateKey;
    } else if (sftpConfig.password) {
      connectOptions.password = sftpConfig.password;
    } else {
      return { success: false, message: 'No password or private key provided' };
    }

    await client.connect(connectOptions);

    const testPath = sftpConfig.remotePath || '/';
    const list = await client.list(testPath);

    const fileNames = list.slice(0, 5).map((item: any) => item.name); // sample

    await client.end();

    return {
      success: true,
      message: `Connected successfully to ${sftpConfig.host}:${sftpConfig.port}. Found ${list.length} items in ${testPath}.`,
      files: fileNames,
    };
  } catch (error: any) {
    devLog('[Wompi SFTP] Test connection error:', error);
    try { await client.end(); } catch {}
    return { success: false, message: `Connection failed: ${error.message || error}` };
  }
}

export async function listWompiSftpFiles(remotePath?: string): Promise<any[]> {
  const sftpConfig = await getWompiSftpConfig();
  if (!sftpConfig.enabled || !sftpConfig.host) {
    throw new Error('SFTP not configured');
  }

  const client = await getSftpClient();
  try {
    const connectOptions: any = {
      host: sftpConfig.host,
      port: sftpConfig.port,
      username: sftpConfig.username,
    };
    if (sftpConfig.privateKey) connectOptions.privateKey = sftpConfig.privateKey;
    else if (sftpConfig.password) connectOptions.password = sftpConfig.password;

    await client.connect(connectOptions);

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
    const connectOptions: any = {
      host: sftpConfig.host,
      port: sftpConfig.port,
      username: sftpConfig.username,
    };
    if (sftpConfig.privateKey) connectOptions.privateKey = sftpConfig.privateKey;
    else if (sftpConfig.password) connectOptions.password = sftpConfig.password;

    await client.connect(connectOptions);

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
      .filter((f: any) => f.type === '-' && (f.name.includes('settlement') || f.name.includes('report') || f.name.includes('payout') || f.name.includes('transacciones')))
      .sort((a: any, b: any) => (b.modifyTime || 0) - (a.modifyTime || 0))
      .slice(0, 3); // latest 3

    const downloaded: string[] = [];

    for (const file of reportFiles) {
      const fullPath = (sftpConfig.remotePath || '/') + (sftpConfig.remotePath?.endsWith('/') ? '' : '/') + file.name;
      const buffer = await downloadWompiSftpFile(fullPath);
      
      // TODO: parse CSV based on actual Wompi format
      // For now, log content preview and store reference
      const contentPreview = buffer.toString('utf8').slice(0, 500);
      devLog(`[Wompi SFTP] Downloaded ${file.name} (${buffer.length} bytes). Preview:\n${contentPreview}`);

      // Example: if it contains order references, we could update orders here
      // e.g. look for "order_xxx" and set sellerPayoutAt or status

      downloaded.push(file.name);
    }

    return {
      success: true,
      message: `Synced ${downloaded.length} report files.`,
      downloaded,
    };
  } catch (error: any) {
    devLog('[Wompi SFTP] Sync error:', error);
    return { success: false, message: error.message || 'Sync failed' };
  }
}