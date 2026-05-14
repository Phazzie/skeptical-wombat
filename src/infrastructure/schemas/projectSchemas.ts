import { z } from 'zod';

export const ContextConfigSchema = z.object({
  format: z.string().trim().min(1, 'Format is required').max(80),
  title: z.string().trim().min(1, 'Title is required').max(200),
  part: z.string().trim().min(1, 'Part is required').max(200),
}).strict();

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(12_000),
}).strict();

export const BeatSchema = z.object({
  id: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(4_000),
}).strict();

export const ChapterSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  beats: z.array(BeatSchema).max(100),
}).strict();

export const AnalyzeRequestSchema = z.object({
  projectId: z.string().trim().min(1, 'Project ID is required'),
  transcript: z.string().trim().min(1, 'Transcript is required').max(80_000, 'Transcript is too long. Split it into smaller sections.'),
  context: ContextConfigSchema,
}).strict();

export const ChatRequestSchema = z.object({
  projectId: z.string().trim().min(1),
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required').max(50),
  context: ContextConfigSchema,
}).strict();

export const RecommendRequestSchema = z.object({
  projectId: z.string().trim().min(1),
  transcript: z.string().trim().min(1).max(80_000, 'Transcript is too long. Split it into smaller sections.'),
}).strict();

export const ResolveRequestSchema = z.object({
  projectId: z.string().trim().min(1),
  type: z.enum(['gap', 'contradiction']),
  id: z.string().trim().min(1),
}).strict();

export const ProjectUpdateSchema = z.object({
  chapters: z.array(ChapterSchema).min(1).max(60).optional(),
  chatHistory: z.array(ChatMessageSchema).max(50).optional(),
}).strict().refine(
  value => value.chapters !== undefined || value.chatHistory !== undefined,
  'At least one update field is required',
);

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request';
}
