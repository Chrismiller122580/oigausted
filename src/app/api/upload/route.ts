// src/app/api/upload/route.ts - Minimal version to fix build
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // For now, return a placeholder. We'll move to client-side upload next if needed.
    return NextResponse.json({
      success: true,
      url: `/uploads/${Date.now()}-${file.name}` // temporary
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
