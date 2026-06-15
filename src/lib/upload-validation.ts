import { getPlatformConfig } from '@/lib/prisma'

const DEFAULT_MAX_MB = 10

export type UploadValidationResult =
  | { ok: true; maxBytes: number }
  | { ok: false; error: string; status: number }

/** Validate an uploaded file against platform size limits and allowed MIME types. */
export async function validateUploadFile(
  file: File | null,
  opts?: { allowImagesOnly?: boolean }
): Promise<UploadValidationResult> {
  const allowImagesOnly = opts?.allowImagesOnly ?? true

  if (!file || file.size <= 0) {
    return { ok: false, error: 'No file uploaded', status: 400 }
  }

  if (allowImagesOnly && !file.type.startsWith('image/')) {
    return { ok: false, error: 'Only image files are allowed', status: 400 }
  }

  let maxMb = DEFAULT_MAX_MB
  try {
    const cfg = await getPlatformConfig()
    maxMb = (cfg as { maxUploadSizeMB?: number }).maxUploadSizeMB ?? DEFAULT_MAX_MB
  } catch {
    // fall back to default
  }

  const maxBytes = maxMb * 1024 * 1024
  if (file.size > maxBytes) {
    return { ok: false, error: `File too large (max ${maxMb}MB)`, status: 400 }
  }

  return { ok: true, maxBytes }
}