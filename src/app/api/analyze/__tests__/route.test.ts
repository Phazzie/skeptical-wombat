import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../infrastructure/di/container', () => ({
  skepticEngine: {
    analyze: vi.fn().mockResolvedValue(undefined),
  },
  databasePort: {
    findById: vi.fn().mockResolvedValue({
      id: 'user-1',
      state: 'CONFRONTING',
      gaps: [],
      contradictions: [],
      chapters: [],
      score: 50,
    }),
  },
}));

vi.mock('../../../../stack', () => ({
  stackServerApp: {
    getUser: vi.fn(),
  },
}));

// rateLimit module does not exist yet; mock factory creates a virtual module so
// the route can import it without crashing when it's eventually added.
vi.mock('../../../../infrastructure/utils/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date() }),
}));

import { POST } from '../route';
import { stackServerApp } from '../../../../stack';
import { skepticEngine, databasePort } from '../../../../infrastructure/di/container';

const mockUser = { id: 'user-1' };

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  projectId: 'user-1',
  transcript: 'This is my story about growing up...',
  context: { format: 'memoir', title: 'My Story', part: 'Chapter 1' },
};

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stackServerApp.getUser).mockResolvedValue(mockUser as any);
  });

  it('returns 401 when not authenticated', async () => {
    // handleApiError maps "not signed in" -> 401
    vi.mocked(stackServerApp.getUser).mockRejectedValue(new Error('You are not signed in'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 400 when projectId is missing', async () => {
    const { projectId: _omit, ...bodyWithoutId } = validBody;
    const res = await POST(makeRequest(bodyWithoutId));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 403 when projectId does not match userId', async () => {
    vi.mocked(stackServerApp.getUser).mockResolvedValue({ id: 'other-user' } as any);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(403);
  });

  it('returns 400 when transcript is missing', async () => {
    const { transcript: _omit, ...bodyWithoutTranscript } = validBody;
    const res = await POST(makeRequest(bodyWithoutTranscript));
    expect(res.status).toBe(400);
  });

  it('returns 400 when context is incomplete', async () => {
    const res = await POST(makeRequest({ ...validBody, context: { format: 'memoir' } }));
    expect(res.status).toBe(400);
  });

  it('returns 200 with project on valid request', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(vi.mocked(skepticEngine.analyze)).toHaveBeenCalledOnce();
  });

  it('calls skepticEngine.analyze with correct args', async () => {
    await POST(makeRequest(validBody));
    expect(vi.mocked(skepticEngine.analyze)).toHaveBeenCalledWith({
      projectId: 'user-1',
      newTranscript: validBody.transcript,
      context: validBody.context,
    });
  });

  it('fetches the project after analysis', async () => {
    await POST(makeRequest(validBody));
    expect(vi.mocked(databasePort.findById)).toHaveBeenCalledWith('user-1');
  });
});
