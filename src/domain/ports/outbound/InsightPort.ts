import { Gap } from '../../entities/Gap';
import { Contradiction } from '../../entities/Contradiction';
import { Chapter } from '../../entities/Project';

export interface ContextConfig {
  format: string;
  title: string;
  part: string;
}

export interface ChapterRecommendation {
  title: string;
  beats: Array<{ content: string }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InsightPort {
  findGaps(text: string, context: ContextConfig): Promise<Omit<Gap, 'id'>[]>;
  findContradictions(text: string): Promise<Omit<Contradiction, 'id'>[]>;
  recommendStructure(text: string, currentChapters: Chapter[]): Promise<ChapterRecommendation[]>;
  chat(messages: ChatMessage[], context: ContextConfig): Promise<string>;
}
