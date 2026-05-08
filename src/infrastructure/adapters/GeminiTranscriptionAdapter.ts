/**
 * GeminiTranscriptionAdapter — implements TranscriptionPort using Gemini 2.5 Flash.
 *
 * Grok's voice API is a real-time WebSocket stream — it cannot accept a
 * recorded audio blob and return a text transcript. Gemini's multimodal File API
 * handles batch transcription cleanly and is the right tool for this use case.
 *
 * Model: gemini-2.5-flash (latest Flash, native audio understanding).
 * This adapter is intentionally narrow: it only does transcription. All
 * story analysis (gaps, contradictions, chat, structure) goes through Grok.
 */
import { GoogleGenAI } from '@google/genai';
import { TranscriptionPort } from '../../domain/ports/outbound/TranscriptionPort';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import os from 'os';

export class GeminiTranscriptionAdapter implements TranscriptionPort {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const extension = mimeType.includes('webm') ? 'webm' : 'audio';
    const tmpPath = join(os.tmpdir(), `${randomUUID()}-wombat-audio.${extension}`);

    try {
      await writeFile(tmpPath, audioBuffer);

      const uploadResult = await this.ai.files.upload({
        file: tmpPath,
        config: { mimeType },
      });

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Transcribe this audio precisely. Return only the spoken words — no commentary, no formatting, no timestamps.' },
              { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
            ],
          },
        ],
      });

      return response.text?.trim() ?? '';
    } finally {
      // Always clean up the temp file
      await unlink(tmpPath).catch(() => undefined);
    }
  }
}
