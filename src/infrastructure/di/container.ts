/**
 * Dependency Injection Container
 *
 * Wires all ports to their concrete adapters and exposes the SkepticEngine
 * as the single entry point for all domain operations.
 *
 * Adapter selection:
 * - InsightPort       → GrokInsightAdapter (xAI Grok 4.3)
 * - TranscriptionPort → GeminiTranscriptionAdapter (default, gemini-2.5-flash)
 *                       WhisperTranscriptionAdapter (set TRANSCRIPTION_PROVIDER=whisper)
 * - DatabasePort      → NeonDatabaseAdapter (Postgres) when DATABASE_URL is set;
 *                       InMemoryDatabaseAdapter otherwise (local dev fallback)
 * - IdGeneratorPort   → UUIDGenerator
 */
import { SkepticEngine } from '../../domain/services/SkepticEngine';
import { GrokInsightAdapter } from '../adapters/GrokInsightAdapter';
import { GeminiTranscriptionAdapter } from '../adapters/GeminiTranscriptionAdapter';
import { WhisperTranscriptionAdapter } from '../adapters/WhisperTranscriptionAdapter';
import { NeonDatabaseAdapter } from '../adapters/NeonDatabaseAdapter';
import { InMemoryDatabaseAdapter } from '../adapters/InMemoryDatabaseAdapter';
import { UUIDGenerator } from '../adapters/UUIDGenerator';
import { DatabasePort } from '../../domain/ports/outbound/DatabasePort';
import { TranscriptionPort } from '../../domain/ports/outbound/TranscriptionPort';

// Prevent re-initialization on hot-reload in development
const globalForDI = global as unknown as {
  skepticEngine: SkepticEngine;
  databasePort: DatabasePort;
  transcriptionPort: TranscriptionPort;
};

function buildDatabasePort(): DatabasePort {
  if (process.env.DATABASE_URL) {
    return new NeonDatabaseAdapter();
  }
  console.warn(
    '[DI] DATABASE_URL is not set — using InMemoryDatabaseAdapter. ' +
    'Data will not persist between requests. Set DATABASE_URL for production.'
  );
  return new InMemoryDatabaseAdapter();
}

function buildTranscriptionPort(): TranscriptionPort {
  const provider = process.env.TRANSCRIPTION_PROVIDER ?? 'gemini';
  if (provider === 'whisper') {
    console.info('[DI] TranscriptionPort → WhisperTranscriptionAdapter (gpt-4o-transcribe)');
    return new WhisperTranscriptionAdapter();
  }
  console.info('[DI] TranscriptionPort → GeminiTranscriptionAdapter (gemini-2.5-flash)');
  return new GeminiTranscriptionAdapter();
}

export const databasePort: DatabasePort =
  globalForDI.databasePort ?? buildDatabasePort();

export const transcriptionPort: TranscriptionPort =
  globalForDI.transcriptionPort ?? buildTranscriptionPort();

const insightPort = new GrokInsightAdapter();
const idGenerator = new UUIDGenerator();

export const skepticEngine: SkepticEngine =
  globalForDI.skepticEngine ?? new SkepticEngine(insightPort, databasePort, idGenerator);

if (process.env.NODE_ENV !== 'production') {
  globalForDI.databasePort = databasePort;
  globalForDI.transcriptionPort = transcriptionPort;
  globalForDI.skepticEngine = skepticEngine;
}
