export const DEFAULT_XAI_MODEL = 'grok-4.3';
export const DEFAULT_GEMINI_TRANSCRIPTION_MODEL = 'gemini-3-flash-preview';
export const DEFAULT_WHISPER_MODEL = 'gpt-4o-transcribe';

export function getXaiModel(): string {
  return process.env.XAI_MODEL?.trim() || DEFAULT_XAI_MODEL;
}

export function getGeminiTranscriptionModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_TRANSCRIPTION_MODEL;
}

export function getWhisperModel(): string {
  return process.env.WHISPER_MODEL?.trim() || DEFAULT_WHISPER_MODEL;
}
