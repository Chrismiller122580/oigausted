// src/app/api/sign-image/route.ts - Generates signed URLs for private blobs
import { NextResponse } from 'next/server';
import { getSignedUrl } from '@vercel/blob';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const signedUrl = await getSignedUrl(url, { expiresIn: 31536000 }); // 1 year

    return NextResponse.json({ signedUrl });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
  }
}
