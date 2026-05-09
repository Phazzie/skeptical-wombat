/**
 * Stack Auth server app configuration.
 *
 * Required environment variables (set in Vercel → Settings → Environment Variables
 * for the Production environment):
 *   NEXT_PUBLIC_STACK_PROJECT_ID
 *   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
 *   STACK_SECRET_SERVER_KEY
 *
 * Get values from: https://app.stack-auth.com → your project → API Keys
 *
 * Note: @stackframe/stack and all its transitive packages (@stackframe/stack-shared,
 * @stackframe/stack-sc) are bundled by Next.js (not in serverExternalPackages).
 * This ensures Vercel's Lambda functions can find all package files at cold-start.
 */
import 'server-only';
import { StackServerApp } from '@stackframe/stack';

export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
});
