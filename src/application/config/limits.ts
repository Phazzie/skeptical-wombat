/**
 * Shared API limits.
 *
 * These defaults are intentionally conservative. They protect the app from
 * accidental cost spikes, oversized payloads, and browser/server memory pain.
 */
function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return parsed;
}

const MB = 1024 * 1024;

export const API_LIMITS = {
  analyzePerHour: readPositiveIntEnv('RATE_LIMIT_ANALYZE_PER_HOUR', 10),
  transcribePerHour: readPositiveIntEnv('RATE_LIMIT_TRANSCRIBE_PER_HOUR', 30),
  chatPerHour: readPositiveIntEnv('RATE_LIMIT_CHAT_PER_HOUR', 60),
  recommendPerHour: readPositiveIntEnv('RATE_LIMIT_RECOMMEND_PER_HOUR', 20),

  maxTranscriptChars: readPositiveIntEnv('MAX_TRANSCRIPT_CHARS', 60_000),
  maxChatMessages: readPositiveIntEnv('MAX_CHAT_MESSAGES', 50),
  maxChatMessageChars: readPositiveIntEnv('MAX_CHAT_MESSAGE_CHARS', 12_000),

  maxChapters: readPositiveIntEnv('MAX_CHAPTERS', 100),
  maxBeatsPerChapter: readPositiveIntEnv('MAX_BEATS_PER_CHAPTER', 200),
  maxChapterTitleChars: readPositiveIntEnv('MAX_CHAPTER_TITLE_CHARS', 140),
  maxBeatContentChars: readPositiveIntEnv('MAX_BEAT_CONTENT_CHARS', 4_000),

  maxAudioUploadBytes: readPositiveIntEnv('MAX_AUDIO_UPLOAD_MB', 25) * MB,
};

export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/aac',
  'audio/flac',
  'audio/m4a',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-m4a',
  'audio/x-wav',
]);

export function formatBytes(bytes: number): string {
  if (bytes < MB) return `${Math.ceil(bytes / 1024)} KB`;
  return `${Math.ceil(bytes / MB)} MB`;
}
