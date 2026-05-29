import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple temporary fix - just return static data
  // We can make this real SSE later when needed
  return NextResponse.json({
    activeChats: 12,
    onlineSellers: 8,
    pendingOrders: 3,
    message: "Live admin data (placeholder)"
  });
}
