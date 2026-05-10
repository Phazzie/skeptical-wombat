import { NextResponse } from 'next/server';
import { transcriptionPort } from '../../../infrastructure/di/container';
import { handleApiError } from '../../../infrastructure/utils/apiError';
import { checkRateLimit } from '../../../infrastructure/utils/rateLimit';
import { stackServerApp } from '../../../stack';

export const maxDuration = 300;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await stackServerApp.getUser({ or: 'throw' });

    // Rate limit: 30 transcriptions per hour
    const rl = await checkRateLimit(user.id, 'transcribe', 30, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.', resetAt: rl.resetAt },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
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
