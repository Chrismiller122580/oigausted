// src/app/api/upload/route.ts - Private Blob with signed URL for display
import { NextResponse } from 'next/server';
import { put, getSignedUrl } from '@vercel/blob';

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

    // Generate a signed URL that lasts 1 year (for display)
    const signedUrl = await getSignedUrl(blob.url, { expiresIn: 31536000 });

    console.log('✅ Image uploaded and signed URL generated:', signedUrl);

    return NextResponse.json({
      success: true,
      url: signedUrl   // Use this signed URL for display
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload image' 
    }, { status: 500 });
  }
}
