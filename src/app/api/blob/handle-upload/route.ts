import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const jsonResponse = await handleUpload({
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('✅ Blob uploaded successfully:', blob.url);
      },
    });

    return jsonResponse;
  } catch (error: any) {
    console.error('Handle upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' }, 
      { status: 400 }
    );
  }
}
