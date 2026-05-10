/**
 * GeminiTranscriptionAdapter — implements TranscriptionPort using Gemini 3 Flash (Preview).
 *
 * Grok's voice API is a real-time WebSocket stream — it cannot accept a
 * recorded audio blob and return a text transcript. Gemini's multimodal File API
 * handles batch transcription cleanly and is the right tool for this use case.
 *
 * Model: gemini-3-flash-preview (Gemini 3 Flash, released Dec 2025).
 * This adapter is intentionally narrow: it only does transcription. All
 * story analysis (gaps, contradictions, chat, structure) goes through Grok.
 *
 * No temp-file writes: the audio Buffer is passed as a Blob directly to
 * the Gemini File API, eliminating /tmp dependency.
 */
import { GoogleGenAI } from '@google/genai';
import { TranscriptionPort } from '../../domain/ports/outbound/TranscriptionPort';

export class GeminiTranscriptionAdapter implements TranscriptionPort {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const blob = new Blob([audioBuffer], { type: mimeType });

    const uploadResult = await this.ai.files.upload({
      file: blob,
      config: { mimeType },
    });

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
  }
}
