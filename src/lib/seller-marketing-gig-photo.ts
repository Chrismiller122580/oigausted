import { prisma } from '@/lib/prisma';
import { getGigImages } from '@/lib/gig-images';

const MAX_EMBED_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 12_000;

/** AI-enhanced photos persisted to Vercel Blob for marketing downloads. */
export function isSellerMarketingBlobPhoto(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith('vercel-storage.com') &&
      parsed.pathname.includes('marketing-ai-')
    );
  } catch {
    return false;
  }
}

/** Returns photoUrl if it belongs to the seller's gig or is a marketing AI blob asset. */
export async function resolveBrandCardPhotoUrl(
  sellerId: string,
  gigId: string | null | undefined,
  photoUrl: string,
): Promise<string | null> {
  const trimmed = photoUrl?.trim();
  if (!trimmed) return null;

  if (isSellerMarketingBlobPhoto(trimmed)) return trimmed;

  if (!gigId) return null;
  return validateGigPhotoForSeller(sellerId, gigId, trimmed);
}

/** Returns photoUrl if it belongs to the seller's gig. */
export async function validateGigPhotoForSeller(
  sellerId: string,
  gigId: string,
  photoUrl: string,
): Promise<string | null> {
  const trimmed = photoUrl?.trim();
  if (!trimmed || !gigId) return null;

  let gig: { imageUrl: string | null; images: unknown } | null = null;
  try {
    gig = await prisma.gig.findFirst({
      where: { id: gigId, sellerId, deletedAt: null },
      select: { imageUrl: true, images: true },
    });
  } catch {
    gig = await prisma.gig.findFirst({
      where: { id: gigId, sellerId },
      select: { imageUrl: true, images: true },
    });
  }

  if (!gig) return null;

  const allowed = getGigImages(gig);
  return allowed.includes(trimmed) ? trimmed : null;
}

function detectMimeType(bytes: Buffer, contentType: string | null): string {
  if (contentType?.startsWith('image/')) {
    return contentType.split(';')[0].trim();
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
  if (bytes[8] === 0x57 && bytes[9] === 0x45) return 'image/webp';
  return 'image/jpeg';
}

/** Fetch a remote image and return a data URL for SVG embedding. */
export async function fetchImageDataUrl(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'image/*' },
    });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type');
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_EMBED_BYTES) return null;

    const mime = detectMimeType(buffer, contentType);
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}