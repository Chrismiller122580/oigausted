import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

/**
 * Admin-only FAQ management (full list + CRUD).
 * Supports turning individual FAQs on/off (isActive) and full create/edit/delete.
 * Used exclusively from /admin/settings "FAQ Management" tools.
 */

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const faqs = await prisma.faqItem.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Admin FAQs GET error:', error);
    return NextResponse.json({ error: 'Error loading FAQs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { question, answer, category, isActive, order } = body;

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const created = await prisma.faqItem.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        category: (category || 'general').trim(),
        isActive: isActive !== false,
        order: typeof order === 'number' ? order : 0,
      },
    });

    const adminId = session.user.id;
    await logAuditEvent({
      performedById: adminId,
      action: 'FAQ_CREATED',
      targetType: 'FaqItem',
      targetId: created.id,
      details: { question: created.question, category: created.category },
    });

    return NextResponse.json({ faq: created });
  } catch (error) {
    console.error('Admin FAQs POST error:', error);
    return NextResponse.json({ error: 'Error creating FAQ' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'FAQ id is required' }, { status: 400 });
    }

    // Only allow specific fields
    const data: import('@prisma/client').Prisma.FaqItemUpdateInput = {};
    if (typeof updates.question === 'string') data.question = updates.question.trim();
    if (typeof updates.answer === 'string') data.answer = updates.answer.trim();
    if (typeof updates.category === 'string') data.category = updates.category.trim();
    if (typeof updates.isActive === 'boolean') data.isActive = updates.isActive;
    if (typeof updates.order === 'number') data.order = updates.order;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.faqItem.update({
      where: { id },
      data,
    });

    const adminId = session.user.id;
    await logAuditEvent({
      performedById: adminId,
      action: 'FAQ_UPDATED',
      targetType: 'FaqItem',
      targetId: id,
      details: { changedFields: Object.keys(data), isActive: updated.isActive },
    });

    return NextResponse.json({ faq: updated });
  } catch (error) {
    console.error('Admin FAQs PATCH error:', error);
    return NextResponse.json({ error: 'Error updating FAQ' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminFromDb();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'FAQ id is required' }, { status: 400 });
    }

    // Capture before delete for audit
    const existing = await prisma.faqItem.findUnique({ where: { id } });

    await prisma.faqItem.delete({ where: { id } });

    const adminId = session.user.id;
    await logAuditEvent({
      performedById: adminId,
      action: 'FAQ_DELETED',
      targetType: 'FaqItem',
      targetId: id,
      details: { question: existing?.question },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin FAQs DELETE error:', error);
    return NextResponse.json({ error: 'Error deleting FAQ' }, { status: 500 });
  }
}
