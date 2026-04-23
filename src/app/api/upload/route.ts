// app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    });

  } catch (error: any) {
    console.error('Vercel Blob upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image', 
      details: error.message 
    }, { status: 500 });
  }
}