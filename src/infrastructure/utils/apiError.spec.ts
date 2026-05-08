import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { handleApiError } from './apiError';

/**
 * NextResponse is part of next/server — the test environment has no real
 * edge runtime, but next/server exports a compatible implementation that
 * works in Node. We inspect the JSON body via .json() which is a standard
 * Web API Response method.
 */

async function body(res: NextResponse): Promise<Record<string, unknown>> {
  return res.json();
}

describe('handleApiError', () => {
  it('returns 404 for "not found" errors', async () => {
    const res = handleApiError(new Error('Project not found'));
    expect(res.status).toBe(404);
    expect(await body(res)).toEqual({ error: 'Project not found' });
  });

  it('returns 403 for "Forbidden" errors', async () => {
    const res = handleApiError(new Error('Forbidden: access denied'));
    expect(res.status).toBe(403);
    expect(await body(res)).toEqual({ error: 'Forbidden: access denied' });
  });

  it('returns 400 for "required" errors', async () => {
    const res = handleApiError(new Error('Transcript is required'));
    expect(res.status).toBe(400);
    expect(await body(res)).toEqual({ error: 'Transcript is required' });
  });

  it('returns 500 by default for generic errors', async () => {
    const res = handleApiError(new Error('Something exploded'));
    expect(res.status).toBe(500);
    expect(await body(res)).toEqual({ error: 'Something exploded' });
  });

  it('returns 500 for non-Error unknowns', async () => {
    const res = handleApiError('a bare string');
    expect(res.status).toBe(500);
    expect(await body(res)).toEqual({ error: 'An unexpected error occurred' });
  });

  it('returns 500 for null', async () => {
    const res = handleApiError(null);
    expect(res.status).toBe(500);
  });

  it('respects a custom defaultStatus', async () => {
    const res = handleApiError(new Error('Boom'), 503);
    expect(res.status).toBe(503);
  });
});
