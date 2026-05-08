import { NextResponse } from 'next/server';
import { databasePort } from '../../../../infrastructure/di/container';
import { handleApiError } from '../../../../infrastructure/utils/apiError';
import { stackServerApp } from '../../../../stack';
import { Project } from '../../../../domain/entities/Project';
import { ProjectState } from '../../../../domain/entities/ProjectState';
import { Chapter } from '../../../../domain/entities/Project';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });
    const { id } = await params;

    if (id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const project = await databasePort.findById(id);
    return NextResponse.json({ project: project ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });
    const { id } = await params;

    if (id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json() as { chapters?: Chapter[] };

    let project = await databasePort.findById(id);
    if (!project) {
      project = Project.restore(id, ProjectState.EXCAVATING, [], [], 50, []);
    }

    if (body.chapters) {
      // Use domain method — no direct property mutation from outside the aggregate
      project.setChapters(body.chapters);
    }

    await databasePort.save(project);
    return NextResponse.json({ success: true, project });
  } catch (error) {
    return handleApiError(error);
  }
}
