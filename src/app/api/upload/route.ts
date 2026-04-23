// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
<<<<<<< HEAD
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
=======
import { put } from '@vercel/blob';
>>>>>>> e068defe272c6ab029f64eb945a1336ce9f80281

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Better debugging
    console.log('Session in upload route:', {
      hasSession: !!session,
      userId: session?.user?.id,
      role: (session?.user as any)?.role,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in as a seller',
        debug: 'No valid session found' 
      }, { status: 401 });
    }

    // Optional: Only allow sellers to upload (recommended)
    const userRole = (session.user as any)?.role;
    if (userRole !== 'seller') {
      return NextResponse.json({ error: 'Only sellers can upload gig images' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

<<<<<<< HEAD
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    console.log('✅ Image uploaded to Public Vercel Blob:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
=======
    const blob = await put(`gigs/${Date.now()}-${file.name}`, file, {
      access: 'private',
    });

    console.log('✅ Uploaded to oigausted-blob:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url
>>>>>>> e068defe272c6ab029f64eb945a1336ce9f80281
    });

  } catch (error: any) {
<<<<<<< HEAD
    console.error('Vercel Blob upload error:', error);
=======
    console.error('Upload error:', error);
>>>>>>> e068defe272c6ab029f64eb945a1336ce9f80281
    return NextResponse.json({ 
      error: error.message || 'Failed to upload image. Check BLOB_READ_WRITE_TOKEN.' 
    }, { status: 500 });
  }
}