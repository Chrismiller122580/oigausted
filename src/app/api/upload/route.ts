// src/app/api/upload/route.ts - Final version with better diagnostics
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    // Diagnostic log
    console.log('BLOB_READ_WRITE_TOKEN present?', !!process.env.BLOB_READ_WRITE_TOKEN);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ 
        error: 'Server misconfiguration: BLOB_READ_WRITE_TOKEN is missing' 
      }, { status: 500 });
    }

    const blob = await put(`gigs/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    console.log('✅ Image uploaded successfully:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url
    });
  } catch (error: any) {
    console.error('Full upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload image. Check Vercel logs.' 
    }, { status: 500 });
  }
}
