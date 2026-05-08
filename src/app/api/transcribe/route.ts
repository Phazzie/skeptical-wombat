import { NextResponse } from 'next/server';
import { transcriptionPort } from '../../../infrastructure/di/container';
import { handleApiError } from '../../../infrastructure/utils/apiError';
import { stackServerApp } from '../../../stack';

export const maxDuration = 300;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    await stackServerApp.getUser({ or: 'throw' });

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = audioFile.type || 'audio/webm';

    const transcript = await transcriptionPort.transcribeAudio(buffer, mimeType);

    return NextResponse.json({ transcript });
  } catch (error) {
    return handleApiError(error);
  }
}
