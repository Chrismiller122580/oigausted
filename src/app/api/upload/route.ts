import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);

    // Save file locally
    await writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;

    console.log('✅ Image uploaded locally:', url);

    return NextResponse.json({
      success: true,
      url: url,
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image', 
      details: error.message 
    }, { status: 500 });
  }
}
