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

const stackProjectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID ?? '11111111-1111-4111-8111-111111111111';
const stackPublishableClientKey =
  process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ?? 'build-time-placeholder-client-key';
const stackSecretServerKey = process.env.STACK_SECRET_SERVER_KEY ?? 'build-time-placeholder-server-key';

export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  projectId: stackProjectId,
  publishableClientKey: stackPublishableClientKey,
  secretServerKey: stackSecretServerKey,
  urls: {
    signIn: '/sign-in',
    signUp: '/sign-up',
    handler: '/handler',
    afterSignIn: '/app',
    afterSignUp: '/app',
    afterSignOut: '/',
    home: '/app',
  },
});
