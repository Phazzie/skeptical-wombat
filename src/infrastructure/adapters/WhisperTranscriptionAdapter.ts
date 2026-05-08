/**
 * WhisperTranscriptionAdapter — implements TranscriptionPort using OpenAI's
 * audio transcription models.
 *
 * Default model: gpt-4o-transcribe (best accuracy, released 2025).
 * Override with WHISPER_MODEL env var, e.g. "whisper-1" for the classic model.
 *
 * Uses the openai npm SDK which is already a project dependency (used by
 * GrokInsightAdapter with a custom baseURL). Here we use the default OpenAI
 * base URL.
 *
 * Switch to this adapter by setting: TRANSCRIPTION_PROVIDER=whisper
 */
import OpenAI, { toFile } from 'openai';
import { TranscriptionPort } from '../../domain/ports/outbound/TranscriptionPort';

const WHISPER_MODEL = process.env.WHISPER_MODEL ?? 'gpt-4o-transcribe';

export class WhisperTranscriptionAdapter implements TranscriptionPort {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    // Determine a sensible file extension from the MIME type
    const ext = mimeType.includes('webm') ? 'webm'
      : mimeType.includes('mp4') ? 'mp4'
      : mimeType.includes('mpeg') || mimeType.includes('mp3') ? 'mp3'
      : mimeType.includes('wav') ? 'wav'
      : 'webm';

    const file = await toFile(audioBuffer, `recording.${ext}`, { type: mimeType });

    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: WHISPER_MODEL,
      response_format: 'text',
    });

    // response_format: 'text' returns a plain string
    return (transcription as unknown as string).trim();
  }
}
