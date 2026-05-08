import { NextResponse } from 'next/server';
import { skepticEngine } from '../../../infrastructure/di/container';
import { handleApiError } from '../../../infrastructure/utils/apiError';
import { stackServerApp } from '../../../stack';

export const maxDuration = 300;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });
    const body = await request.json() as { projectId?: string; transcript?: string };
    const { projectId, transcript } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    if (projectId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const recommendation = await skepticEngine.recommendStructure({ projectId, transcript });
    return NextResponse.json({ recommendation });
  } catch (error) {
    return handleApiError(error);
  }
}
