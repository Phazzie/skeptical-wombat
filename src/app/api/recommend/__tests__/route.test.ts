import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../../infrastructure/di/container', () => ({
  skepticEngine: {
    // The route calls: skepticEngine.recommendStructure({ projectId, transcript })
    recommendStructure: vi.fn().mockResolvedValue([
      { title: 'Chapter 1: The Beginning', beats: [{ content: 'Opening scene' }] },
    ]),
  },
}));

vi.mock('../../../../stack', () => ({
  stackServerApp: {
    getUser: vi.fn(),
  },
}));

vi.mock('../../../../infrastructure/utils/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date() }),
}));

import { POST } from '../route';
import { stackServerApp } from '../../../../stack';
import { skepticEngine } from '../../../../infrastructure/di/container';

const mockUser = { id: 'user-1' };

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/recommend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stackServerApp.getUser).mockResolvedValue(mockUser as any);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(stackServerApp.getUser).mockRejectedValue(new Error('You are not signed in'));
    const res = await POST(makeRequest({ projectId: 'user-1', transcript: 'story' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when projectId is missing', async () => {
    const res = await POST(makeRequest({ transcript: 'story' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 403 when projectId does not match userId', async () => {
    vi.mocked(stackServerApp.getUser).mockResolvedValue({ id: 'other-user' } as any);
    const res = await POST(makeRequest({ projectId: 'user-1', transcript: 'story' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when transcript is missing', async () => {
    const res = await POST(makeRequest({ projectId: 'user-1' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 with recommendation on valid request', async () => {
    const res = await POST(makeRequest({ projectId: 'user-1', transcript: 'My story content...' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recommendation).toBeDefined();
    expect(Array.isArray(body.recommendation)).toBe(true);
  });

  it('calls skepticEngine.recommendStructure with correct args', async () => {
    await POST(makeRequest({ projectId: 'user-1', transcript: 'My story content...' }));
    expect(vi.mocked(skepticEngine.recommendStructure)).toHaveBeenCalledWith({
      projectId: 'user-1',
      transcript: 'My story content...',
    });
  });
});
