import { put } from '@vercel/blob';
import { fetchImageDataUrl } from '@/lib/seller-marketing-gig-photo';

const AI_MODEL = 'grok-imagine-image-quality';

export type EnhanceMarketingPhotoInput = {
  photoUrl: string;
  prompt: string;
  businessName: string;
  gigTitle: string;
};

export type EnhanceMarketingPhotoResult = {
  url: string;
  source: 'blob' | 'xai';
};

function buildEnhancePrompt(input: EnhanceMarketingPhotoInput): string {
  const base =
    input.prompt?.trim() ||
    `Professional social media marketing visual for ${input.gigTitle} by ${input.businessName}`;
  return `${base}. Vibrant, polished, suitable for Instagram feed. Keep the service recognizable. Subtle OigaGig orange brand accent. No text overlays.`;
}

/** Enhance a gig photo with Grok Imagine image editing; persist to Blob when configured. */
export async function enhanceMarketingPhoto(
  input: EnhanceMarketingPhotoInput,
): Promise<EnhanceMarketingPhotoResult | null> {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.x.ai/v1/images/edits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        prompt: buildEnhancePrompt(input),
        image: {
          url: input.photoUrl,
          type: 'image_url',
        },
      }),
    });

    if (!response.ok) {
      console.error('[ai-visual] xAI edit failed:', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
      url?: string;
    };

    const generatedUrl = data.data?.[0]?.url || data.url;
    const b64 = data.data?.[0]?.b64_json;

    if (b64) {
      const buffer = Buffer.from(b64, 'base64');
      const blobUrl = await tryUploadBuffer(buffer, 'image/png');
      if (blobUrl) return { url: blobUrl, source: 'blob' };
      return { url: `data:image/png;base64,${b64}`, source: 'xai' };
    }

    if (!generatedUrl) return null;

    const blobUrl = await tryPersistRemoteImage(generatedUrl);
    if (blobUrl) return { url: blobUrl, source: 'blob' };

    return { url: generatedUrl, source: 'xai' };
  } catch (error) {
    console.error('[ai-visual] enhance failed:', error);
    return null;
  }
}

async function tryUploadBuffer(buffer: Buffer, mime: string): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  try {
    const ext = mime.includes('png') ? 'png' : 'jpg';
    const blob = await put(`marketing-ai-${Date.now()}.${ext}`, buffer, {
      access: 'public',
      addRandomSuffix: true,
      token,
      contentType: mime,
    });
    return blob.url;
  } catch {
    return null;
  }
}

async function tryPersistRemoteImage(url: string): Promise<string | null> {
  const dataUrl = await fetchImageDataUrl(url);
  if (!dataUrl) return null;

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return tryUploadBuffer(Buffer.from(match[2], 'base64'), match[1]);
}