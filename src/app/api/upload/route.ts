// src/app/api/upload/route.ts - Private Blob + raw URL
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const blob = await put(`gigs/${Date.now()}-${file.name}`, file, {
      access: 'private',
    });

    console.log('✅ Uploaded to private Blob:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url   // raw private URL - we'll sign it when displaying
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}
