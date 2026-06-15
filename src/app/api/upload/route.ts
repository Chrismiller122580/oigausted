import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateUploadFile } from '@/lib/upload-validation';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Please log in first' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const validation = await validateUploadFile(file)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // In development without Vercel Blob configured, we allow direct URL input instead
    if (!token) {
      console.warn('Vercel Blob not configured — upload disabled in this environment');
      return NextResponse.json({ 
        error: 'Direct file upload not available in this dev environment. Please paste an image URL instead (e.g. from picsum.photos or imgur).',
        uploadDisabled: true
      }, { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
      token,
    });

    console.log('✅ Image uploaded to Public Vercel Blob:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
    });

  } catch (error: unknown) {
    console.error('Vercel Blob upload error:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Failed to upload image', 
      details
    }, { status: 500 });
  }
}
