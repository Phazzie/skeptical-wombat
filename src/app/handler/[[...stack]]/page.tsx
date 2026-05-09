/**
 * Stack Auth handler route.
 * This page handles all Stack Auth callbacks (OAuth, email verification, etc.).
 * It must exist at this path for Stack Auth to function correctly.
 * Do not add custom UI here — Stack Auth renders its own flow.
 */
import { StackHandler } from '@stackframe/stack';
import { stackServerApp } from '../../../stack';

export default function StackHandlerPage(props: unknown) {
  return <StackHandler app={stackServerApp} routeProps={props as object} fullPage />;
}
