import { NextResponse } from 'next/server';
import { z } from 'zod';
import { skepticEngine } from '../../../infrastructure/di/container';
import { handleApiError } from '../../../infrastructure/utils/apiError';
import { stackServerApp } from '../../../stack';

export const maxDuration = 300;

const RecommendSchema = z.object({
  projectId: z.string().min(1),
  transcript: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });
    const body = await request.json();
    const parsed = RecommendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    const { projectId, transcript } = parsed.data;

    if (projectId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recommendation = await skepticEngine.recommendStructure({ projectId, transcript });
    return NextResponse.json({ recommendation });
  } catch (error) {
    return handleApiError(error);
  }
}
