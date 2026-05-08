/**
 * Stack Auth server app configuration.
 * Stack Auth is Neon's auth partner — configure via the Neon console
 * under Database → Auth, or directly at stack-auth.com.
 *
 * Required environment variables:
 *   NEXT_PUBLIC_STACK_PROJECT_ID
 *   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
 *   STACK_SECRET_SERVER_KEY
 */
import 'server-only';
import { StackServerApp } from '@stackframe/stack';

export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
});
