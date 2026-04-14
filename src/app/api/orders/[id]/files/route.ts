import { NextResponse } from 'next/server';
import { getFiles, addFile } from '@/lib/orderStorage';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const files = getFiles(id);
  return NextResponse.json({ files });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const newFile = {
      name: file.name,
      size: file.size,
      type: file.type,
    };

    const success = addFile(id, newFile);

    if (success) {
      console.log(`✅ File uploaded and saved: ${file.name} for order ${id}`);
      return NextResponse.json({ 
        success: true, 
        file: newFile 
      });
    } else {
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
