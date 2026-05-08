import { stackServerApp } from './stack';

/**
 * Protect all app routes and API routes. The marketing landing page (/)
 * and auth routes (/sign-in, /sign-up) remain public.
 */
export const middleware = stackServerApp.middleware;

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
