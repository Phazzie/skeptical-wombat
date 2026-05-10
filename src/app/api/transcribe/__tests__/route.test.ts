import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../infrastructure/di/container', () => ({
  transcriptionPort: {
    transcribeAudio: vi.fn().mockResolvedValue('Hello, this is a transcription.'),
  },
}));

vi.mock('../../../../stack', () => ({
  stackServerApp: {
    getUser: vi.fn(),
  },
}));

vi.mock('../../../../infrastructure/utils/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29, resetAt: new Date() }),
}));

import { POST } from '../route';
import { stackServerApp } from '../../../../stack';
import { transcriptionPort } from '../../../../infrastructure/di/container';

const mockUser = { id: 'user-1' };

function makeAudioRequest(hasFile = true) {
  const formData = new FormData();
  if (hasFile) {
    const blob = new Blob(['fake audio data'], { type: 'audio/webm' });
    formData.append('audio', blob, 'recording.webm');
  }
  return new Request('http://localhost/api/transcribe', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/transcribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stackServerApp.getUser).mockResolvedValue(mockUser as any);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(stackServerApp.getUser).mockRejectedValue(new Error('You are not signed in'));
    const res = await POST(makeAudioRequest());
    expect(res.status).toBe(401);
  });

  it('returns 400 when no audio file', async () => {
    const res = await POST(makeAudioRequest(false));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 200 with transcript on valid request', async () => {
    const res = await POST(makeAudioRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transcript).toBe('Hello, this is a transcription.');
  });

  it('calls transcriptionPort.transcribeAudio with buffer and mimeType', async () => {
    await POST(makeAudioRequest());
    expect(vi.mocked(transcriptionPort.transcribeAudio)).toHaveBeenCalledWith(
      expect.any(Buffer),
      'audio/webm'
    );
  });
});
