import { NextResponse } from 'next/server';
import { z } from 'zod';
import { stackServerApp } from '../../../stack';
import { databasePort } from '../../../infrastructure/di/container';
import { GrokInsightAdapter } from '../../../infrastructure/adapters/GrokInsightAdapter';

export const maxDuration = 300;

const ChatSchema = z.object({
  projectId: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).min(1, 'At least one message is required'),
  context: z.object({
    format: z.string(),
    title: z.string(),
    part: z.string(),
  }),
});

const insightAdapter = new GrokInsightAdapter();

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });

    const body = await request.json();
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    const { projectId, messages, context } = parsed.data;

    if (projectId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const project = await databasePort.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const stream = await insightAdapter.chatStream(messages, context);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = (chunk as { choices?: Array<{ delta?: { content?: string | null } }> }).choices?.[0]?.delta?.content ?? '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message.includes('not signed in') ? 401 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
