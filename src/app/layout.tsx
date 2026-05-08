import type { Metadata } from 'next';
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable}`}>
      <body suppressHydrationWarning className="antialiased">
        <StackProvider app={stackServerApp}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
