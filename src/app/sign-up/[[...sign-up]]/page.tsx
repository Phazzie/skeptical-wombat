'use client';

import { SignUp } from '@stackframe/stack';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--ink-black)]">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <span className="text-6xl">🐨</span>
          <h1 className="font-display text-4xl uppercase tracking-tighter text-white mt-4">
            SkepticalWombat
          </h1>
          <p className="text-white/50 text-sm mt-2 uppercase tracking-widest font-bold">
            Create your account
          </p>
        </div>
        <SignUp afterSignUp="/app" />
        <p className="text-center text-white/30 text-xs mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-[var(--neon-accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
