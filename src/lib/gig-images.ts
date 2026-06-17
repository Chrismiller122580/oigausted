import { parseJsonArrayField } from '@/lib/utils'

export const MAX_GIG_IMAGES = 8

export function getGigImages(gig: {
  imageUrl?: string | null
  images?: unknown
}): string[] {
  const parsed = parseJsonArrayField<string>(gig.images).filter(Boolean)
  if (parsed.length > 0) return parsed
  return gig.imageUrl ? [gig.imageUrl] : []
}

export function normalizeGigImagePayload(
  images?: string[] | null,
  imageUrl?: string | null
): { images: string | null; imageUrl: string | null } {
  const list = (images?.length ? images : imageUrl ? [imageUrl] : [])
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, MAX_GIG_IMAGES)

  return {
    images: list.length > 0 ? JSON.stringify(list) : null,
    imageUrl: list[0] ?? null,
  }
}

export function parseGigImagesField(images: unknown): string[] {
  return parseJsonArrayField<string>(images).filter(Boolean)
}