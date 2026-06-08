import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { applyCodeChange, CodeEditParams, undoLastApply } from '@/lib/grok-code';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id ?? null;

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Support undo action (upgrade for the in-app tool)
    if (body.action === 'undo' && body.file) {
      const result = await undoLastApply(body.file, userId);
      return NextResponse.json({ success: true, result });
    }

    const { file, description, old_string, new_string, diff } = body as CodeEditParams & { diff?: string };

    if (!file || !description) {
      return NextResponse.json({ error: 'file and description are required' }, { status: 400 });
    }

    // Prefer structured old/new for reliable apply
    if (!old_string || !new_string) {
      return NextResponse.json(
        {
          error:
            'old_string and new_string are required for safe application. ' +
            'The proposal must contain exact text to replace (with surrounding context for uniqueness).',
        },
        { status: 400 }
      );
    }

    const result = await applyCodeChange(
      {
        file,
        description,
        old_string,
        new_string,
        diff,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[grok-apply] Error applying code change:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to apply code change',
      },
      { status: 400 }
    );
  }
}
