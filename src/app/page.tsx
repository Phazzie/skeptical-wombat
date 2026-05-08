import Link from 'next/link';
import { ArrowRight, Mic, Zap, BookOpen, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--ink-black)] text-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-4 border-b border-white/5 backdrop-blur-md bg-[var(--ink-black)]/80">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐨</span>
          <span className="font-display text-xl uppercase tracking-tighter text-white">
            SkepticalWombat
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-white/60 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-[var(--neon-accent)] text-[var(--ink-black)] px-5 py-2 text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-[4px_4px_0_0_rgba(224,255,0,0.3)]"
          >
            Start Writing
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-950/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Wombat badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 text-xs font-bold uppercase tracking-widest text-[var(--neon-accent)]">
            <Zap size={12} /> AI Writing Coach — Zero Comfort Zone
          </div>

          {/* Hero emoji */}
          <div
            className="text-[120px] md:text-[160px] leading-none mb-6 select-none"
            style={{ filter: 'drop-shadow(0 0 60px rgba(224,255,0,0.15))' }}
          >
            🐨
          </div>

          {/* Headline */}
          <h1 className="font-display text-6xl md:text-8xl lg:text-[112px] leading-none uppercase tracking-tighter mb-6">
            <span className="text-white">Your Story.</span>
            <br />
            <span
              className="text-[var(--neon-accent)]"
              style={{ textShadow: '0 0 80px rgba(224,255,0,0.4)' }}
            >
              No Hiding.
            </span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            Dump your story. The Wombat reads it, finds the gaps you skipped,
            calls out the contradictions, and helps you build something real.
            No coddling. No judgment. Just the story you actually have.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-3 bg-[var(--neon-accent)] text-[var(--ink-black)] px-8 py-4 font-display text-xl uppercase tracking-wider hover:scale-[1.02] transition-transform shadow-[8px_8px_0_0_rgba(224,255,0,0.2)]"
            >
              Start Writing Free <ArrowRight size={20} />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-3 border-2 border-white/20 text-white/70 px-8 py-4 font-bold text-sm uppercase tracking-widest hover:border-white/40 hover:text-white transition-all"
            >
              Already have an account
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--ink-black)] to-transparent pointer-events-none" />
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 bg-[var(--paper-white)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-600 mb-3">
              What the Wombat does
            </p>
            <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter text-[var(--ink-black)]">
              Three Moves.
              <br />
              <span className="text-fuchsia-600">No Mercy.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Mic size={32} />,
                number: '01',
                title: 'Brain Dump',
                subtitle: 'Type or Dictate',
                body: 'Voice recording → instant transcription. Or just type. Momentum Mode blocks backspace so you actually finish the thought instead of editing yourself into silence.',
                color: 'fuchsia',
              },
              {
                icon: <Zap size={32} />,
                number: '02',
                title: 'Wombat Reads',
                subtitle: 'Gaps & Contradictions',
                body: "The Wombat finds what you dodged, what you skipped, and where your story contradicts itself. No moral judgment. Controversial? Good. Let's talk about it.",
                color: 'neon',
              },
              {
                icon: <BookOpen size={32} />,
                number: '03',
                title: 'Structure It',
                subtitle: 'Chapters & Beats',
                body: 'Drag and drop your story into chapters and beats. Or tell the Wombat to structure it — it reads your dump and gives you a blueprint worth building on.',
                color: 'fuchsia',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-[var(--ink-black)] p-8 border-2 border-[var(--ink-black)] flex flex-col gap-6"
                style={{
                  boxShadow:
                    feature.color === 'neon'
                      ? '8px 8px 0 0 rgba(224,255,0,1)'
                      : '8px 8px 0 0 rgba(217,70,239,1)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="p-3"
                    style={{
                      color:
                        feature.color === 'neon' ? 'var(--neon-accent)' : 'rgb(232,121,249)',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <span
                    className="font-display text-5xl leading-none opacity-20 text-white"
                  >
                    {feature.number}
                  </span>
                </div>
                <div>
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{
                      color:
                        feature.color === 'neon' ? 'var(--neon-accent)' : 'rgb(232,121,249)',
                    }}
                  >
                    {feature.subtitle}
                  </p>
                  <h3 className="font-display text-3xl uppercase tracking-tight text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-[var(--ink-black)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--neon-accent)] mb-3">
              The Process
            </p>
            <h2 className="font-display text-5xl md:text-6xl uppercase tracking-tighter text-white">
              How It Works
            </h2>
          </div>

          <div className="flex flex-col gap-0">
            {[
              {
                step: '01',
                title: 'Dump Everything',
                body: "Write it all out. Voice or keyboard. Don't stop. Don't edit. Just get it out. The Wombat can handle mess.",
              },
              {
                step: '02',
                title: 'Take the Feedback',
                body: 'Gaps appear on the right. Contradictions too. Read them. The Wombat isn\'t wrong. It found the thing you were hoping to slide past.',
              },
              {
                step: '03',
                title: 'Build the Structure',
                body: 'Switch to the Structure tab. Drag beats into order. Ask the Wombat to suggest chapters. Start to see what the story actually is.',
              },
              {
                step: '04',
                title: 'Talk It Through',
                body: 'Hit the Chat tab and go deeper. The Wombat remembers your project. Ask questions. Push back. Figure out what you\'re actually writing.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex gap-8 p-8 border-b border-white/5 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
              >
                <div className="flex-shrink-0">
                  <span className="font-display text-7xl text-white/10 leading-none">
                    {item.step}
                  </span>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-display text-3xl uppercase tracking-tight text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF POINTS ── */}
      <section className="py-16 px-6 bg-fuchsia-950/30 border-y border-fuchsia-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { stat: 'Zero', label: 'Moral judgments', desc: 'Write about anything.' },
              { stat: '100%', label: 'Backend AI calls', desc: 'Your API keys never touch the browser.' },
              { stat: 'One', label: 'Goal', desc: 'Get the story out of your head.' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="font-display text-5xl text-[var(--neon-accent)]">{item.stat}</span>
                <span className="font-bold text-white text-sm uppercase tracking-widest">{item.label}</span>
                <span className="text-white/40 text-xs">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 bg-[var(--ink-black)] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-8xl mb-6 block">🐨</span>
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter text-white mb-6">
            Ready to Stop Hiding?
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            The story you&apos;ve been avoiding writing is the one worth reading.
            The Wombat is waiting.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-3 bg-[var(--neon-accent)] text-[var(--ink-black)] px-10 py-5 font-display text-2xl uppercase tracking-wider hover:scale-[1.02] transition-transform shadow-[12px_12px_0_0_rgba(224,255,0,0.2)]"
          >
            Start Writing — Free <ArrowRight size={24} />
          </Link>
          <div className="flex items-center justify-center gap-6 mt-8 text-white/30 text-xs">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={12} /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={12} /> No word limits
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={12} /> No judgment
            </span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <span>🐨</span>
          <span className="font-bold uppercase tracking-widest">SkepticalWombat</span>
          <span>— Your Story. Unfiltered and Sharpened.</span>
        </div>
        <div className="text-white/20 text-xs">
          Powered by Grok 4.3 + Gemini · Built with Next.js · Auth by Neon
        </div>
      </footer>
    </main>
  );
}
