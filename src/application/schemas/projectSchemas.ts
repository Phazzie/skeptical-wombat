import { z } from 'zod';
import { API_LIMITS } from '../config/limits';

export const BeatSchema = z.object({
  id: z.string().min(1).max(120),
  content: z.string().min(1).max(API_LIMITS.maxBeatContentChars),
}).strict();

export const ChapterSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(API_LIMITS.maxChapterTitleChars),
  beats: z.array(BeatSchema).max(API_LIMITS.maxBeatsPerChapter),
}).strict();

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(API_LIMITS.maxChatMessageChars),
}).strict();

export const ContextConfigSchema = z.object({
  format: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  part: z.string().min(1).max(200),
}).strict();

export const ProjectUpdateSchema = z.object({
  chapters: z.array(ChapterSchema).max(API_LIMITS.maxChapters).optional(),
  chatHistory: z.array(ChatMessageSchema).max(API_LIMITS.maxChatMessages).optional(),
}).strict().refine(
  value => value.chapters !== undefined || value.chatHistory !== undefined,
  { message: 'At least one project field is required' },
);

export const AnalyzeRequestSchema = z.object({
  projectId: z.string().min(1),
  transcript: z.string().min(1).max(API_LIMITS.maxTranscriptChars),
  context: ContextConfigSchema,
}).strict();

export const RecommendRequestSchema = z.object({
  projectId: z.string().min(1),
  transcript: z.string().min(1).max(API_LIMITS.maxTranscriptChars),
}).strict();

export const ChatRequestSchema = z.object({
  projectId: z.string().min(1),
  messages: z.array(ChatMessageSchema).min(1).max(API_LIMITS.maxChatMessages),
  context: ContextConfigSchema,
}).strict();

export const ResolveRequestSchema = z.object({
  projectId: z.string().min(1),
  type: z.enum(['gap', 'contradiction']),
  id: z.string().min(1).max(120),
}).strict();

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request';
}
