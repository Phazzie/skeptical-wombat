/**
 * Outbound port for audio-to-text transcription.
 * Concrete adapter: GeminiTranscriptionAdapter (uses Gemini multimodal API
 * since Grok does not support batch audio transcription — its voice API
 * is real-time WebSocket only).
 */
export interface TranscriptionPort {
  transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string>;
}
