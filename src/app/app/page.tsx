'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '@stackframe/stack';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  MessageSquare,
  ListTree,
  BookOpen,
  Sparkles,
  Mic,
  MicOff,
  LogOut,
  ChevronDown,
  CheckCircle,
  Download,
} from 'lucide-react';
import { StructureEditor } from '../../components/StructureEditor';
import { ChatInterface } from '../../components/ChatInterface';
import { Chapter, ChatMessage } from '../../domain/entities/Project';

export const dynamic = 'force-dynamic';

type Gap = { id: string; description: string; isResolved: boolean };
type Contradiction = { id: string; statementA: string; statementB: string; isResolved: boolean };
type ProjectData = {
  id: string;
  state: string;
  gaps: Gap[];
  contradictions: Contradiction[];
  chapters: Chapter[];
  chatHistory?: ChatMessage[];
};

type Tab = 'DRAFT' | 'STRUCTURE' | 'CHAT';

export default function AppPage() {
  const user = useUser({ or: 'redirect' });
  const projectId = user?.id ?? null;

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<Tab>('DRAFT');
  const [transcript, setTranscript] = useState('');
  const [contextFormat, setContextFormat] = useState('Book');
  const [contextTitle, setContextTitle] = useState('');
  const [contextPart, setContextPart] = useState('');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: 'default-chapter', title: 'Chapter 1', beats: [] },
  ]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [momentumMode, setMomentumMode] = useState(false);

  // ── Voice recording ──
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ── Load project on mount ──
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/project/${projectId}`)
      .then((r) => r.json())
      .then((data: { project?: ProjectData }) => {
        if (data.project) {
          setProject(data.project);
          if (data.project.chapters?.length) setChapters(data.project.chapters);
          if (data.project.chatHistory?.length) setChatHistory(data.project.chatHistory);
        }
      })
      .catch(console.error);
  }, [projectId]);

  // ── Waveform draw loop ──
  const drawWaveform = useCallback(() => {
    const drawFrame = () => {
      if (!analyserRef.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#E0FF00';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Wire up waveform analyser
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop waveform
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
        analyserRef.current = null;

        setIsRecording(false);
        setIsTranscribing(true);
        stream.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'draft_recording.webm');

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const data = await res.json() as { transcript?: string; error?: string };
          if (data.transcript) {
            setTranscript((prev) =>
              prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + data.transcript
            );
          } else {
            setError('Failed to transcribe audio properly.');
          }
        } catch {
          setError('Error connecting to Wombat transcription services.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      drawWaveform();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Could not start recording:', msg);
      setError('Microphone access is not allowed or supported.');
    }
  };

  // ── Momentum Mode ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      momentumMode &&
      ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  // ── Analyze ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim() || !contextTitle.trim() || !contextPart.trim()) {
      setError('Fill out Title, Part, and Content before pitching.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          transcript,
          context: { format: contextFormat, title: contextTitle, part: contextPart },
        }),
      });
      const data = await res.json() as { success?: boolean; project?: ProjectData; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      if (data.project) {
        setProject(data.project);
        if (data.project.chapters?.length) setChapters(data.project.chapters);
      }
      if (activeTab === 'DRAFT') setActiveTab('STRUCTURE');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resolve gap / contradiction ──
  const handleResolve = async (type: 'gap' | 'contradiction', id: string) => {
    if (!projectId) return;
    // Optimistic update
    setProject((prev) => {
      if (!prev) return prev;
      if (type === 'gap') {
        return { ...prev, gaps: prev.gaps.map((g) => g.id === id ? { ...g, isResolved: true } : g) };
      }
      return { ...prev, contradictions: prev.contradictions.map((c) => c.id === id ? { ...c, isResolved: true } : c) };
    });

    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, type, id }),
      });
      const data = await res.json() as { project?: ProjectData };
      if (data.project) setProject(data.project);
    } catch (err) {
      console.error('Resolve error:', err);
    }
  };

  // ── Structure recommendation ──
  const handleRecommend = async () => {
    if (!transcript.trim()) {
      setError('I need some content in the active draft before I can recommend a structure.');
      return;
    }
    setRecommending(true);
    setError(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, transcript }),
      });
      const data = await res.json() as { recommendation?: Array<{ title: string; beats: Array<{ content: string }> }>; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Recommendation failed');

      if (data.recommendation) {
        const newChapters: Chapter[] = data.recommendation.map((rec, idx) => ({
          id: `rec-chap-${idx}-${Date.now()}`,
          title: rec.title,
          beats: rec.beats.map((b, bIdx) => ({
            id: `rec-beat-${idx}-${bIdx}-${Date.now()}`,
            content: b.content,
          })),
        }));
        setChapters(newChapters);

        if (projectId) {
          fetch(`/api/project/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chapters: newChapters }),
          }).catch(console.error);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Recommendations failed. Wombat is grumpy.');
    } finally {
      setRecommending(false);
    }
  };

  // ── Chapter save ──
  const saveChapters = (updated: Chapter[]) => {
    setChapters(updated);
    if (!projectId) return;
    fetch(`/api/project/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapters: updated }),
    }).catch(console.error);
  };

  // ── Chat history save ──
  const handleHistoryUpdate = useCallback((messages: ChatMessage[]) => {
    setChatHistory(messages);
    if (!projectId) return;
    fetch(`/api/project/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatHistory: messages }),
    }).catch(console.error);
  }, [projectId]);

  // ── Export to markdown ──
  const handleExport = () => {
    let md = `# ${contextTitle || 'Untitled'}\n\n`;
    md += `**Format:** ${contextFormat}`;
    if (contextPart) md += ` | **Section:** ${contextPart}`;
    md += '\n\n---\n\n';

    if (transcript) {
      md += `## Brain Dump\n\n${transcript}\n\n`;
    }

    if (chapters.some((c) => c.beats.length > 0 || c.title !== 'Chapter 1')) {
      md += `## Structure\n\n`;
      chapters.forEach((ch, i) => {
        md += `### ${i + 1}. ${ch.title}\n\n`;
        ch.beats.forEach((b) => { md += `- ${b.content}\n`; });
        md += '\n';
      });
    }

    if (project?.gaps.length) {
      const unresolved = project.gaps.filter((g) => !g.isResolved);
      const resolved = project.gaps.filter((g) => g.isResolved);
      md += `## Wombat Callouts\n\n`;
      unresolved.forEach((g) => { md += `- [ ] ${g.description}\n`; });
      resolved.forEach((g) => { md += `- [x] ~~${g.description}~~\n`; });
      md += '\n';
    }

    if (project?.contradictions.length) {
      md += `## Contradictions\n\n`;
      project.contradictions.forEach((c) => {
        const prefix = c.isResolved ? '~~' : '';
        const suffix = c.isResolved ? '~~' : '';
        md += `- ${prefix}"${c.statementA}" vs "${c.statementB}"${suffix}\n`;
      });
      md += '\n';
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(contextTitle || 'wombat-export').replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayEmail = user?.primaryEmail ?? '';
  const displayName = user?.displayName ?? displayEmail;
  const unresolvedCount =
    (project?.gaps.filter((g) => !g.isResolved).length ?? 0) +
    (project?.contradictions.filter((c) => !c.isResolved).length ?? 0);

  return (
    <main className="min-h-screen bg-[var(--ink-black)] text-[var(--paper-white)] overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 md:px-10 py-3 border-b border-white/5 backdrop-blur-md bg-[var(--ink-black)]/90">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐨</span>
          <span className="font-display text-lg uppercase tracking-tighter text-white">SkepticalWombat</span>
        </div>

        <div className="hidden sm:flex bg-white/5 border border-white/10 p-0.5">
          {(['DRAFT', 'STRUCTURE', 'CHAT'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 relative ${
                activeTab === tab
                  ? 'bg-[var(--neon-accent)] text-[var(--ink-black)]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'DRAFT' && <Sparkles size={12} />}
              {tab === 'STRUCTURE' && <ListTree size={12} />}
              {tab === 'CHAT' && <MessageSquare size={12} />}
              {tab}
              {tab === 'STRUCTURE' && unresolvedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unresolvedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Export button */}
          <button
            onClick={handleExport}
            title="Export to Markdown"
            className="hidden sm:flex items-center gap-1.5 text-white/40 hover:text-[var(--neon-accent)] transition-colors text-[10px] font-bold uppercase tracking-widest"
          >
            <Download size={14} /> Export
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <span className="w-7 h-7 rounded-full bg-fuchsia-600 flex items-center justify-center text-white text-[10px] font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:block max-w-[120px] truncate">{displayName}</span>
              <ChevronDown size={12} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 mt-2 w-48 bg-[#111] border border-white/10 shadow-[4px_4px_0_0_rgba(224,255,0,0.2)] z-50"
                >
                  <div className="p-3 border-b border-white/10">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Signed in as</p>
                    <p className="text-xs text-white truncate mt-0.5">{displayEmail}</p>
                  </div>
                  <button
                    onClick={() => user?.signOut()}
                    className="w-full flex items-center gap-2 p-3 text-xs text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* ── MOBILE TAB BAR ── */}
      <div className="sm:hidden flex border-b border-white/10">
        {(['DRAFT', 'STRUCTURE', 'CHAT'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === tab
                ? 'border-b-2 border-[var(--neon-accent)] text-[var(--neon-accent)]'
                : 'text-white/40'
            }`}
          >
            {tab === 'DRAFT' && <Sparkles size={12} />}
            {tab === 'STRUCTURE' && <ListTree size={12} />}
            {tab === 'CHAT' && <MessageSquare size={12} />}
            {tab}
            {tab === 'STRUCTURE' && unresolvedCount > 0 && (
              <span className="absolute top-1 right-4 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
                {unresolvedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-600/90 text-white font-bold uppercase text-xs p-4 text-center border border-red-500/50 flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 underline opacity-70 hover:opacity-100">
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">

              {/* DRAFT */}
              {activeTab === 'DRAFT' && (
                <motion.div
                  key="draft"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="flex flex-col gap-8"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-4xl uppercase tracking-tight text-white">
                      The Brain Dump
                      <span className="block h-1 w-20 bg-[var(--neon-accent)] mt-1" />
                    </h2>
                    <button
                      onClick={() => setMomentumMode((v) => !v)}
                      className={`flex items-center gap-2 px-4 py-2 border-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        momentumMode
                          ? 'border-[var(--neon-accent)] bg-[var(--neon-accent)]/10 text-[var(--neon-accent)]'
                          : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      {momentumMode ? <Lock size={14} /> : <Unlock size={14} />}
                      Momentum: {momentumMode ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--neon-accent)] tracking-widest">Format</label>
                        <select
                          className="bg-white/5 border border-white/15 p-3 text-sm text-white focus:outline-none focus:border-[var(--neon-accent)] transition-colors"
                          value={contextFormat}
                          onChange={(e) => setContextFormat(e.target.value)}
                        >
                          <option value="Book">Book</option>
                          <option value="Blog Post">Blog Post</option>
                          <option value="Screenplay">Screenplay</option>
                          <option value="Short Story">Short Story</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--neon-accent)] tracking-widest">Working Title</label>
                        <input
                          className="bg-white/5 border border-white/15 p-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[var(--neon-accent)] transition-colors"
                          placeholder="Untitled Masterpiece"
                          value={contextTitle}
                          onChange={(e) => setContextTitle(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--neon-accent)] tracking-widest">Section</label>
                        <input
                          className="bg-white/5 border border-white/15 p-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[var(--neon-accent)] transition-colors"
                          placeholder="Chapter 1 / Act I"
                          value={contextPart}
                          onChange={(e) => setContextPart(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <textarea
                        onKeyDown={handleKeyDown}
                        className={`w-full bg-white/5 border-2 p-6 h-[420px] text-base leading-relaxed text-white placeholder-white/20 focus:outline-none resize-none transition-colors ${
                          momentumMode
                            ? 'border-red-500/70 ring-2 ring-red-500/10'
                            : 'border-white/10 focus:border-[var(--neon-accent)]/50'
                        }`}
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Ramble away. Dictate or type. Don't look back."
                      />
                      {momentumMode && (
                        <div className="absolute top-4 right-14 animate-pulse">
                          <Lock size={14} className="text-red-500/70" />
                        </div>
                      )}

                      {/* Live waveform canvas */}
                      {isRecording && (
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={36}
                          className="absolute bottom-14 left-4 right-14 w-[calc(100%-4.5rem)] h-9 opacity-80"
                        />
                      )}

                      {/* Mic button */}
                      <button
                        type="button"
                        onClick={toggleRecording}
                        disabled={isTranscribing}
                        title={isRecording ? 'Stop Recording' : 'Dictate your story'}
                        className={`absolute bottom-4 right-4 p-3 transition-all ${
                          isRecording
                            ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                            : isTranscribing
                            ? 'bg-fuchsia-500/50 text-white cursor-not-allowed'
                            : 'bg-white/10 text-[var(--neon-accent)] hover:bg-white/15 hover:scale-105 border border-white/10'
                        }`}
                      >
                        {isTranscribing ? (
                          <Sparkles size={20} className="animate-spin" />
                        ) : isRecording ? (
                          <MicOff size={20} />
                        ) : (
                          <Mic size={20} />
                        )}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !transcript.trim()}
                      className="bg-[var(--neon-accent)] text-[var(--ink-black)] py-5 font-display text-2xl uppercase tracking-wider flex items-center justify-center gap-4 hover:scale-[1.01] transition-transform shadow-[8px_8px_0_0_rgba(224,255,0,0.2)] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99]"
                    >
                      {loading ? (
                        <><Sparkles size={20} className="animate-spin" /> Analyzing Draft…</>
                      ) : (
                        'Review Draft'
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STRUCTURE */}
              {activeTab === 'STRUCTURE' && (
                <motion.div
                  key="structure"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-4xl uppercase tracking-tight text-white">
                      The Outline
                      <span className="block h-1 w-20 bg-fuchsia-500 mt-1" />
                    </h2>
                    <button
                      onClick={handleRecommend}
                      disabled={recommending}
                      className="flex items-center gap-2 bg-fuchsia-600 text-white px-5 py-3 uppercase text-xs font-bold tracking-widest hover:bg-fuchsia-500 transition-colors shadow-[4px_4px_0_0_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <Sparkles size={16} />
                      {recommending ? 'Structuring…' : 'Wombat, Structure This!'}
                    </button>
                  </div>
                  <StructureEditor chapters={chapters} onUpdate={saveChapters} />
                </motion.div>
              )}

              {/* CHAT */}
              {activeTab === 'CHAT' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <h2 className="font-display text-4xl uppercase tracking-tight text-white mb-6">
                    The Dialogue
                    <span className="block h-1 w-20 bg-[var(--neon-accent)] mt-1" />
                  </h2>
                  <ChatInterface
                    projectId={projectId}
                    context={{ format: contextFormat, title: contextTitle, part: contextPart }}
                    initialMessages={chatHistory.length > 0 ? chatHistory : undefined}
                    onHistoryUpdate={handleHistoryUpdate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <h2 className="font-display text-3xl uppercase tracking-tight text-white">
              The Feedback
              <span className="block h-1 w-16 bg-[var(--neon-accent)] mt-1" />
            </h2>

            {!project ? (
              <div className="bg-white/5 border border-dashed border-white/10 p-8 text-center flex flex-col items-center gap-4 rounded-sm">
                <BookOpen size={40} className="text-white/20" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30">Awaiting Analysis</p>
                  <p className="text-[10px] text-white/20 mt-1">Submit your draft to get the Wombat&apos;s callouts</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Gaps */}
                <div className="bg-[var(--ink-black)] border border-white/10 p-5 flex flex-col gap-4" style={{ boxShadow: '6px 6px 0 0 rgba(224,255,0,0.8)' }}>
                  <h3 className="text-[var(--neon-accent)] font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <span>🔥</span> Callouts ({project.gaps.filter(g => !g.isResolved).length}/{project.gaps.length})
                  </h3>
                  {project.gaps.length === 0 ? (
                    <p className="text-white/30 text-xs italic">No gaps found. Suspicious.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {project.gaps.map((gap) => (
                        <div
                          key={gap.id}
                          className={`text-xs leading-relaxed p-3 border-l-2 flex items-start gap-2 group transition-opacity ${
                            gap.isResolved
                              ? 'border-white/20 text-white/30 line-through opacity-50'
                              : 'border-[var(--neon-accent)] text-white/80 bg-white/5'
                          }`}
                        >
                          <span className="flex-1">{gap.description}</span>
                          {!gap.isResolved && (
                            <button
                              onClick={() => handleResolve('gap', gap.id)}
                              title="Mark resolved"
                              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-green-400 transition-all flex-shrink-0 mt-0.5"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contradictions */}
                <div className="bg-[var(--ink-black)] border border-white/10 p-5 flex flex-col gap-4" style={{ boxShadow: '6px 6px 0 0 rgba(217,70,239,0.8)' }}>
                  <h3 className="text-fuchsia-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <span>🚨</span> Contradictions ({project.contradictions.filter(c => !c.isResolved).length}/{project.contradictions.length})
                  </h3>
                  {project.contradictions.length === 0 ? (
                    <p className="text-white/30 text-xs italic">Story is internally consistent. For now.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {project.contradictions.map((c) => (
                        <div
                          key={c.id}
                          className={`text-[11px] leading-relaxed p-3 border-l-2 group ${
                            c.isResolved
                              ? 'border-white/20 text-white/30 opacity-50'
                              : 'border-red-500 bg-white/5'
                          }`}
                        >
                          <p className="text-white/50">&ldquo;{c.statementA}&rdquo;</p>
                          <div className="h-px bg-white/10 my-2" />
                          <div className="flex items-end justify-between gap-2">
                            <p className="text-white/80">&ldquo;{c.statementB}&rdquo;</p>
                            {!c.isResolved && (
                              <button
                                onClick={() => handleResolve('contradiction', c.id)}
                                title="Mark resolved"
                                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-green-400 transition-all flex-shrink-0"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Export (mobile) */}
                <button
                  onClick={handleExport}
                  className="sm:hidden flex items-center justify-center gap-2 border border-white/10 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-[var(--neon-accent)] hover:border-[var(--neon-accent)]/30 transition-colors"
                >
                  <Download size={14} /> Export to Markdown
                </button>
              </div>
            )}

            <div className="mt-auto text-[9px] font-bold uppercase tracking-widest text-white/15 border-t border-white/5 pt-4">
              Session: {projectId ? `${projectId.slice(0, 8)}…` : 'Loading…'}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
