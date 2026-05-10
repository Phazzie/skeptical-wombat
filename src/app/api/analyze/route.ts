import { NextResponse } from 'next/server';
import { z } from 'zod';
import { skepticEngine, databasePort } from '../../../infrastructure/di/container';
import { handleApiError } from '../../../infrastructure/utils/apiError';
import { checkRateLimit } from '../../../infrastructure/utils/rateLimit';
import { stackServerApp } from '../../../stack';

export const maxDuration = 300;

const AnalyzeSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  transcript: z.string().min(1, 'Transcript is required'),
  context: z.object({
    format: z.string().min(1, 'Format is required'),
    title: z.string().min(1, 'Title is required'),
    part: z.string().min(1, 'Part is required'),
  }),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });

    const body = await request.json();
    const parsed = AnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    const { projectId, transcript, context } = parsed.data;

    if (projectId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limit: 10 analyses per hour
    const rl = await checkRateLimit(user.id, 'analyze', 10, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before analyzing again.', resetAt: rl.resetAt },
        { status: 429 }
      );
    }

    await skepticEngine.analyze({ projectId, newTranscript: transcript, context });

    const project = await databasePort.findById(projectId);
    return NextResponse.json({ success: true, project });
  } catch (error) {
    return handleApiError(error);
  }
}
