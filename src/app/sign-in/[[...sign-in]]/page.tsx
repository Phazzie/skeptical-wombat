'use client';

import { SignIn } from '@stackframe/stack';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--ink-black)]">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <span className="text-6xl">🐨</span>
          <h1 className="font-display text-4xl uppercase tracking-tighter text-white mt-4">
            SkepticalWombat
          </h1>
          <p className="text-white/50 text-sm mt-2 uppercase tracking-widest font-bold">
            Sign in to continue
          </p>
        </div>
        <SignIn afterSignIn="/app" />
      </div>
    </main>
  );
}
