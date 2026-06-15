import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public endpoint for active FAQs.
 * Used by /support page to render the dynamic, admin-controlled FAQ list.
 * Returns only isActive=true items, sorted by order asc then createdAt desc.
 */
export async function GET() {
  try {
    const faqs = await prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
      },
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Public FAQs GET error:', error);
    // Graceful empty list so support page never breaks
    return NextResponse.json({ faqs: [] });
  }
}
