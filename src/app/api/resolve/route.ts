import { NextResponse } from 'next/server';
import { z } from 'zod';
import { stackServerApp } from '../../../stack';
import { databasePort } from '../../../infrastructure/di/container';
import { handleApiError } from '../../../infrastructure/utils/apiError';

const ResolveSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(['gap', 'contradiction']),
  id: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });

    const body = await request.json();
    const parsed = ResolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    const { projectId, type, id } = parsed.data;

    if (projectId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const project = await databasePort.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (type === 'gap') {
      project.resolveGap(id);
    } else {
      project.resolveContradiction(id);
    }

    await databasePort.save(project);
    return NextResponse.json({ success: true, project });
  } catch (error) {
    return handleApiError(error);
  }
}
