/**
 * Stack Auth server app configuration.
 *
 * Lazily instantiated so any initialization error surfaces inside a request
 * handler (where it can be logged and caught by error boundaries) rather than
 * crashing the Lambda at cold-start and producing a bare 500 with no logs.
 *
 * Required environment variables (set in Vercel → Settings → Environment Variables
 * for the Production environment):
 *   NEXT_PUBLIC_STACK_PROJECT_ID
 *   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
 *   STACK_SECRET_SERVER_KEY
 *
 * Get values from: https://app.stack-auth.com → your project → API Keys
 */
import 'server-only';
import { StackServerApp } from '@stackframe/stack';

let _instance: StackServerApp | null = null;

function getInstance(): StackServerApp {
  if (_instance === null) {
    _instance = new StackServerApp({ tokenStore: 'nextjs-cookie' });
  }
  return _instance;
}

/**
 * The Stack Auth server app.
 *
 * Exposed as a Proxy so existing `import { stackServerApp }` call sites work
 * without modification — all property accesses are forwarded to the lazily
 * created `StackServerApp` instance at request time, not at module load time.
 */
export const stackServerApp: StackServerApp = new Proxy({} as StackServerApp, {
  get(_target, prop, receiver) {
    const app = getInstance();
    const value = Reflect.get(app, prop, receiver);
    return typeof value === 'function' ? (value as Function).bind(app) : value;
  },
  has(_target, prop) {
    return Reflect.has(getInstance(), prop);
  },
});
