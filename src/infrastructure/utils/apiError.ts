import { NextResponse } from 'next/server';

export function handleApiError(error: unknown, defaultStatus = 500): NextResponse {
  if (error instanceof Error) {
    const status = error.message.includes('not found') ? 404
      : error.message.includes('Forbidden') ? 403
      : error.message.includes('required') ? 400
      : defaultStatus;

    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ error: 'An unexpected error occurred' }, { status: defaultStatus });
}
