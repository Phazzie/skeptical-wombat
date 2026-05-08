import { NextResponse } from 'next/server';
import { skepticEngine } from '../../../infrastructure/di/container';
import { handleApiError } from '../../../infrastructure/utils/apiError';
import { stackServerApp } from '../../../stack';
import { ChatMessage } from '../../../domain/ports/outbound/InsightPort';

export const maxDuration = 300;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });
    const body = await request.json() as {
      projectId?: string;
      messages?: ChatMessage[];
      context?: { format?: string; title?: string; part?: string };
    };

    const { projectId, messages, context } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    if (projectId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!messages?.length) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }
    if (!context?.format || !context?.title || !context?.part) {
      return NextResponse.json({ error: 'Context is required' }, { status: 400 });
    }

    const reply = await skepticEngine.chatWithWombat({
      projectId,
      messages,
      context: { format: context.format, title: context.title, part: context.part },
    });

    return NextResponse.json({ reply });
  } catch (error) {
    return handleApiError(error);
  }
}
