import { NextResponse } from 'next/server';
import { skepticEngine, databasePort } from '../../../infrastructure/di/container';
import { handleApiError } from '../../../infrastructure/utils/apiError';
import { stackServerApp } from '../../../stack';

export const maxDuration = 300;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });
    const body = await request.json() as {
      projectId?: string;
      transcript?: string;
      context?: { format?: string; title?: string; part?: string };
    };

    const { projectId, transcript, context } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    if (projectId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }
    if (!context?.format || !context?.title || !context?.part) {
      return NextResponse.json({ error: 'Context (format, title, part) is required' }, { status: 400 });
    }

    await skepticEngine.analyze({
      projectId,
      newTranscript: transcript,
      context: { format: context.format, title: context.title, part: context.part },
    });

    const project = await databasePort.findById(projectId);
    return NextResponse.json({ success: true, project });
  } catch (error) {
    return handleApiError(error);
  }
}
