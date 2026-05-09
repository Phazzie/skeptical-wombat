import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Inter, Anton } from 'next/font/google';
import { StackProvider, StackTheme } from '@stackframe/stack';
import { stackServerApp } from '../stack';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton' });

export const metadata: Metadata = {
  title: {
    default: 'SkepticalWombat — Your Story, Unfiltered',
    template: '%s | SkepticalWombat',
  },
  description:
    'The AI that won\'t let you hide from your own story. Gap detection, contradiction spotting, story structure — zero slack, no cowardice.',
  openGraph: {
    title: 'SkepticalWombat — Your Story, Unfiltered',
    description: 'Dump your story. The Wombat calls you out. Ship something real.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkepticalWombat',
    description: 'The AI that won\'t let you hide from your own story.',
    images: ['/og-image.png'],
  },
};

/**
 * Loading fallback for the root Suspense boundary.
 *
 * StackProvider / StackTheme are Stack Auth client components that call
 * suspendIfSsr() during SSR. This fallback is shown on the server while
 * the client takes over and renders the actual content.
 */
function RootLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #333',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        {/*
         * Suspense boundary guards against StackProvider / StackTheme calling
         * suspendIfSsr() during SSR for dynamic routes (sign-in, sign-up, handler).
         * Without this boundary the entire server render crashes with a 500.
         * With it, the server sends the fallback spinner and the client picks up
         * and renders the real Stack Auth components normally.
         */}
        <Suspense fallback={<RootLoadingFallback />}>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              {children}
            </StackTheme>
          </StackProvider>
        </Suspense>
      </body>
    </html>
  );
}
