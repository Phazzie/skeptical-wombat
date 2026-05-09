import { NextRequest, NextResponse } from 'next/server';

/**
 * Route matcher for app and API routes.
 *
 * Auth protection is enforced at the route level:
 *   - Client pages: useUser({ or: 'redirect' })  (src/app/app/page.tsx)
 *   - API handlers: stackServerApp.getUser({ or: 'throw' }) (src/app/api/*)
 *
 * Stack Auth v2 removed the stackServerApp.middleware helper.
 * Route-level guards are sufficient — this middleware just defines the matcher.
 */
export function middleware(_request: NextRequest): NextResponse {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/app/:path*',
    '/api/analyze/:path*',
    '/api/chat/:path*',
    '/api/project/:path*',
    '/api/recommend/:path*',
    '/api/transcribe/:path*',
  ],
};
