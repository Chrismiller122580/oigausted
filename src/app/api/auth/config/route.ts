import { NextResponse } from 'next/server';
import { getTurnstileSiteKey, isTurnstileConfigured } from '@/lib/turnstile';

export async function GET() {
  const googleEnabled = 
    !!process.env.GOOGLE_CLIENT_ID && 
    !!process.env.GOOGLE_CLIENT_SECRET;

  return NextResponse.json({
    googleEnabled,
    turnstileEnabled: isTurnstileConfigured(),
    turnstileSiteKey: getTurnstileSiteKey(),
  });
}
