import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — use vi.hoisted() so the factory can close over these variables.
const { mockUpload, mockGenerateContent } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => {
  // GoogleGenAI is used as `new GoogleGenAI(...)` — must be a proper class constructor.
  class GoogleGenAI {
    files = { upload: mockUpload };
    models = { generateContent: mockGenerateContent };
  }
  return { GoogleGenAI };
});

import { GeminiTranscriptionAdapter } from '../GeminiTranscriptionAdapter';

describe('GeminiTranscriptionAdapter', () => {
  let adapter: GeminiTranscriptionAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new GeminiTranscriptionAdapter();
    mockUpload.mockResolvedValue({
      uri: 'https://files.gemini/audio-123',
      mimeType: 'audio/webm',
    });
    mockGenerateContent.mockResolvedValue({ text: '  This is the transcription.  ' });
  });

  it('transcribes audio and returns trimmed text', async () => {
    const result = await adapter.transcribeAudio(Buffer.from('fake audio data'), 'audio/webm');
    expect(result).toBe('This is the transcription.');
  });

  it('uses gemini-3-flash-preview model', async () => {
    await adapter.transcribeAudio(Buffer.from('audio'), 'audio/webm');
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-3-flash-preview' })
    );
  });

  it('passes file URI from upload result into generateContent', async () => {
    await adapter.transcribeAudio(Buffer.from('audio'), 'audio/webm');
    const call = mockGenerateContent.mock.calls[0][0];
    const filePart = call.contents[0].parts[1];
    expect(filePart.fileData.fileUri).toBe('https://files.gemini/audio-123');
  });

  it('uploads audio as a Blob (no temp file path)', async () => {
    await adapter.transcribeAudio(Buffer.from('audio bytes'), 'audio/mp4');
    const uploadCall = mockUpload.mock.calls[0][0];
    // The new implementation passes a Blob directly (no temp file writes)
    expect(uploadCall.file).toBeInstanceOf(Blob);
    expect(uploadCall.config.mimeType).toBe('audio/mp4');
  });

  it('returns empty string when response text is null', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: null });
    const result = await adapter.transcribeAudio(Buffer.from('audio'), 'audio/webm');
    expect(result).toBe('');
  });

  it('returns empty string when response text is undefined', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: undefined });
    const result = await adapter.transcribeAudio(Buffer.from('audio'), 'audio/webm');
    expect(result).toBe('');
  });

  it('passes the correct mimeType to both upload and fileData', async () => {
    await adapter.transcribeAudio(Buffer.from('audio'), 'audio/ogg');
    const uploadCall = mockUpload.mock.calls[0][0];
    expect(uploadCall.config.mimeType).toBe('audio/ogg');
    const generateCall = mockGenerateContent.mock.calls[0][0];
    const filePart = generateCall.contents[0].parts[1];
    expect(filePart.fileData.mimeType).toBe('audio/webm'); // from upload result mock
  });
});
