import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const files = await prisma.orderFile.findMany({
    where: { orderId: id },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ files });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Upload file to Vercel Blob
    const blob = await put(`orders/${id}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    // Save to database
    const savedFile = await prisma.orderFile.create({
      data: {
        name: file.name,
        url: blob.url,
        size: file.size,
        type: file.type,
        uploadedBy: session.user.role === 'buyer' ? 'buyer' : 'seller',
        orderId: id,
      }
    });

    console.log(`✅ File uploaded to Vercel Blob for order ${id}: ${blob.url}`);

    return NextResponse.json({ 
      success: true, 
      file: savedFile 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
