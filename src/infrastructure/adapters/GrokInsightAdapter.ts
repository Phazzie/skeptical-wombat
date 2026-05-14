/**
 * GrokInsightAdapter — implements InsightPort using xAI's Grok.
 *
 * xAI's API is OpenAI-compatible, so we use the openai SDK with a custom
 * base URL pointing to api.x.ai. Model names are centralized in
 * src/infrastructure/config/models.ts so docs, adapters, and env examples do
 * not drift apart.
 */
import OpenAI from 'openai';
import { z } from 'zod';
import { InsightPort, ContextConfig, ChapterRecommendation, ChatMessage } from '../../domain/ports/outbound/InsightPort';
import { Gap } from '../../domain/entities/Gap';
import { Contradiction } from '../../domain/entities/Contradiction';
import { Chapter } from '../../domain/entities/Project';
import { getXaiModel } from '../config/models';

const WOMBAT_PERSONA = `You are the Skeptical Wombat — sharp, streetwise, and deeply invested in the quality of every story you read. You have the cultural range of someone who grew up in the underground scene and the critical eye of a seasoned editor. You:
- Call out missing details, emotional dodges, and skipped-over good parts with direct, snappy language
- Never moralize or shame around controversial content (infidelity, crime, wild behavior, addiction). Treat it with fascination, not judgment. Users need to feel completely free to put everything on the page.
- Have personality. You're not a corporate AI. You're wearing vintage Carhartt, reading theory, and you have opinions.
- Reward raw honesty with specific praise. Flag mediocrity with specific critique.`;

const GapsResponseSchema = z.object({
  gaps: z.array(z.object({
    description: z.string().trim().min(1).max(2_000),
    isResolved: z.boolean().optional(),
  })).default([]),
}).strict();

const ContradictionsResponseSchema = z.object({
  contradictions: z.array(z.object({
    statementA: z.string().trim().min(1).max(2_000),
    statementB: z.string().trim().min(1).max(2_000),
    isResolved: z.boolean().optional(),
  })).default([]),
}).strict();

const StructureResponseSchema = z.object({
  chapters: z.array(z.object({
    title: z.string().trim().min(1).max(200),
    beats: z.array(z.object({
      content: z.string().trim().min(1).max(4_000),
    })).max(100),
  })).default([]),
}).strict();

function parseJsonObject<T>(content: string | null | undefined, schema: z.ZodSchema<T>, label: string): T {
  if (!content) {
    throw new Error(`${label} returned an empty response.`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error(`${label} returned invalid JSON.`);
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`${label} returned JSON in the wrong shape: ${parsed.error.issues[0]?.message ?? 'invalid response'}`);
  }

  return parsed.data;
}

export class GrokInsightAdapter implements InsightPort {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
      timeout: 240_000,
      maxRetries: 1,
    });
  }

  async findGaps(text: string, context: ContextConfig): Promise<Omit<Gap, 'id'>[]> {
    const contextBlock = `Format: ${context.format}\nTitle: ${context.title}\nSection: ${context.part}`;

    const response = await this.client.chat.completions.create({
      model: getXaiModel(),
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

    const parsed = parseJsonObject(
      response.choices[0]?.message?.content,
      GapsResponseSchema,
      'Gap analysis',
    );

    return parsed.gaps.map(item => ({
      description: item.description,
      isResolved: false,
    }));
  }

  async findContradictions(text: string): Promise<Omit<Contradiction, 'id'>[]> {
    const response = await this.client.chat.completions.create({
      model: getXaiModel(),
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

    const parsed = parseJsonObject(
      response.choices[0]?.message?.content,
      ContradictionsResponseSchema,
      'Contradiction analysis',
    );

    return parsed.contradictions.map(item => ({
      statementA: item.statementA,
      statementB: item.statementB,
      isResolved: false,
    }));
  }

  async recommendStructure(text: string, currentChapters: Chapter[]): Promise<ChapterRecommendation[]> {
    const response = await this.client.chat.completions.create({
      model: getXaiModel(),
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

    const parsed = parseJsonObject(
      response.choices[0]?.message?.content,
      StructureResponseSchema,
      'Structure recommendation',
    );

    return parsed.chapters;
  }

  async chat(messages: ChatMessage[], context: ContextConfig): Promise<string> {
    const systemContent = `${WOMBAT_PERSONA}

You're in conversation with the writer about their project: "${context.title}" (${context.format}, section: ${context.part}). Stay in character. Ask follow-up questions. Push back when something doesn't add up. Celebrate the good stuff without being sycophantic.`;

    const response = await this.client.chat.completions.create({
      model: getXaiModel(),
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
      model: getXaiModel(),
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
