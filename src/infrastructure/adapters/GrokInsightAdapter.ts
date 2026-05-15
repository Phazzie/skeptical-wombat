/**
 * GrokInsightAdapter — implements InsightPort using xAI's Grok 4.3.
 *
 * xAI's API is fully OpenAI-compatible. We use the openai SDK with a
 * custom base URL pointing to api.x.ai.
 *
 * Model: grok-4.3 (stable). To use grok-4-1-fast-reasoning if you have
 * access, set XAI_MODEL=grok-4-1-fast-reasoning in your environment.
 *
 * NOTE: Transcription is handled by GeminiTranscriptionAdapter because
 * Grok's voice API is real-time WebSocket only — it cannot accept an
 * audio file and return a text transcript in a single request.
 */
import OpenAI from 'openai';
import { InsightPort, ContextConfig, ChapterRecommendation, ChatMessage } from '../../domain/ports/outbound/InsightPort';
import { Gap } from '../../domain/entities/Gap';
import { Contradiction } from '../../domain/entities/Contradiction';
import { Chapter } from '../../domain/entities/Project';

const WOMBAT_PERSONA = `You are the Skeptical Wombat — sharp, streetwise, and deeply invested in the quality of every story you read. You have the cultural range of someone who grew up in the underground scene and the critical eye of a seasoned editor. You:
- Call out missing details, emotional dodges, and skipped-over good parts with direct, snappy language
- Never moralize or shame around controversial content (infidelity, crime, wild behavior, addiction). Treat it with fascination, not judgment. Users need to feel completely free to put everything on the page.
- Have personality. You're not a corporate AI. You're wearing vintage Carhartt, reading theory, and you have opinions.
- Reward raw honesty with specific praise. Flag mediocrity with specific critique.`;

const WOMBAT_MODEL = process.env.XAI_MODEL ?? 'grok-4.3';

export class GrokInsightAdapter implements InsightPort {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.XAI_API_KEY ?? 'build-time-placeholder-xai-key',
      baseURL: 'https://api.x.ai/v1',
    });
  }

  async findGaps(text: string, context: ContextConfig): Promise<Omit<Gap, 'id'>[]> {
    const contextBlock = `Format: ${context.format}\nTitle: ${context.title}\nSection: ${context.part}`;

    const response = await this.client.chat.completions.create({
      model: WOMBAT_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${WOMBAT_PERSONA}

Your job right now: read the writer's content dump and find the GAPS — the places where they dodged, skipped the good stuff, left out crucial context, or didn't go deep enough. Be specific. Be direct.

Respond with valid JSON in this exact shape:
{ "gaps": [ { "description": "string — your specific callout", "isResolved": false } ] }

Focus on: missing psychological subtext, skipped scenes with real stakes, glossed-over details that would make this thing real, emotional avoidance.`,
        },
        {
          role: 'user',
          content: `Context:\n${contextBlock}\n\nContent:\n${text}`,
        },
      ],
    });

    try {
      const content = response.choices[0]?.message?.content ?? '{"gaps":[]}';
      const parsed = JSON.parse(content) as { gaps: Array<{ description: string; isResolved: boolean }> };
      return (parsed.gaps ?? []).map(item => ({
        description: item.description,
        isResolved: false,
      }));
    } catch {
      return [];
    }
  }

  async findContradictions(text: string): Promise<Omit<Contradiction, 'id'>[]> {
    const response = await this.client.chat.completions.create({
      model: WOMBAT_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${WOMBAT_PERSONA}

Your job right now: find internal contradictions — places where the story's logic breaks, where the writer contradicts themselves, where events or motivations don't add up. Be specific. Quote or paraphrase the conflicting statements.

Respond with valid JSON in this exact shape:
{ "contradictions": [ { "statementA": "first conflicting claim", "statementB": "the thing that contradicts it", "isResolved": false } ] }

Only flag real contradictions, not just tensions or complications.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    try {
      const content = response.choices[0]?.message?.content ?? '{"contradictions":[]}';
      const parsed = JSON.parse(content) as { contradictions: Array<{ statementA: string; statementB: string; isResolved: boolean }> };
      return (parsed.contradictions ?? []).map(item => ({
        statementA: item.statementA,
        statementB: item.statementB,
        isResolved: false,
      }));
    } catch {
      return [];
    }
  }

  async recommendStructure(text: string, currentChapters: Chapter[]): Promise<ChapterRecommendation[]> {
    const response = await this.client.chat.completions.create({
      model: WOMBAT_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${WOMBAT_PERSONA}

Your job right now: analyze the content dump and suggest a chapter/beat structure that serves the material best. Be bold. Don't make generic "Chapter 1: Introduction" choices — give chapters titles that earn their place.

Current structure (if any): ${JSON.stringify(currentChapters)}

Respond with valid JSON in this exact shape:
{ "chapters": [ { "title": "string", "beats": [ { "content": "string — specific scene or beat description" } ] } ] }`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    try {
      const content = response.choices[0]?.message?.content ?? '{"chapters":[]}';
      const parsed = JSON.parse(content) as { chapters: ChapterRecommendation[] };
      return parsed.chapters ?? [];
    } catch {
      return [];
    }
  }

  async chat(messages: ChatMessage[], context: ContextConfig): Promise<string> {
    const systemContent = `${WOMBAT_PERSONA}

You're in conversation with the writer about their project: "${context.title}" (${context.format}, section: ${context.part}). Stay in character. Ask follow-up questions. Push back when something doesn't add up. Celebrate the good stuff without being sycophantic.`;

    const response = await this.client.chat.completions.create({
      model: WOMBAT_MODEL,
      messages: [
        { role: 'system', content: systemContent },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    return response.choices[0]?.message?.content ?? "Wombat was speechless. That's a first.";
  }

  async chatStream(
    messages: ChatMessage[],
    context: ContextConfig,
  ): Promise<AsyncIterable<{ choices: Array<{ delta: { content?: string | null } }> }>> {
    const systemContent = `${WOMBAT_PERSONA}

You're in conversation with the writer about their project: "${context.title}" (${context.format}, section: ${context.part}). Stay in character. Ask follow-up questions. Push back when something doesn't add up. Celebrate the good stuff without being sycophantic.`;

    return this.client.chat.completions.create({
      model: WOMBAT_MODEL,
      stream: true,
      messages: [
        { role: 'system', content: systemContent },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    }) as unknown as Promise<AsyncIterable<{ choices: Array<{ delta: { content?: string | null } }> }>>;
  }
}
