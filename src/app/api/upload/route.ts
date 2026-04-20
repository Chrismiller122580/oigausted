// src/app/api/upload/route.ts - Vercel Blob for production (recommended)
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Upload directly to Vercel Blob - public access
    const blob = await put(`gigs/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    console.log('✅ Uploaded to Vercel Blob:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload image' 
    }, { status: 500 });
  }
}
