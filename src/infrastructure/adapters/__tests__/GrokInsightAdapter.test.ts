import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted — use vi.hoisted() to declare variables that the factory can close over.
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('openai', () => {
  // OpenAI is used as `new OpenAI(...)` — must be a proper class constructor.
  class OpenAI {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  }
  return { default: OpenAI };
});

import { GrokInsightAdapter } from '../GrokInsightAdapter';

describe('GrokInsightAdapter', () => {
  let adapter: GrokInsightAdapter;
  const context = { format: 'memoir', title: 'My Story', part: 'Chapter 1' };

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new GrokInsightAdapter();
  });

  describe('findGaps', () => {
    it('parses and returns gaps from Grok response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          gaps: [{ description: 'Missing motivation scene', isResolved: false }],
        }) } }],
      });
      const gaps = await adapter.findGaps('some story text', context);
      expect(gaps).toHaveLength(1);
      expect(gaps[0].description).toBe('Missing motivation scene');
      expect(gaps[0].isResolved).toBe(false);
    });

    it('returns empty array on malformed JSON response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'this is not json' } }],
      });
      const result = await adapter.findGaps('text', context);
      expect(result).toEqual([]);
    });

    it('returns empty array when choices is empty', async () => {
      mockCreate.mockResolvedValueOnce({ choices: [] });
      const result = await adapter.findGaps('text', context);
      // choices[0] is undefined; content fallback is '{"gaps":[]}' so returns []
      expect(result).toEqual([]);
    });

    it('forces isResolved to false regardless of Grok response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          gaps: [{ description: 'A gap', isResolved: true }],
        }) } }],
      });
      const gaps = await adapter.findGaps('text', context);
      expect(gaps[0].isResolved).toBe(false);
    });
  });

  describe('findContradictions', () => {
    it('parses and returns contradictions', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          contradictions: [{ statementA: 'Says X', statementB: 'Also says Y', isResolved: false }],
        }) } }],
      });
      const result = await adapter.findContradictions('text');
      expect(result).toHaveLength(1);
      expect(result[0].statementA).toBe('Says X');
      expect(result[0].statementB).toBe('Also says Y');
    });

    it('returns empty array on JSON without contradictions key', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
      });
      const result = await adapter.findContradictions('text');
      expect(result).toEqual([]);
    });

    it('forces isResolved to false regardless of response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          contradictions: [{ statementA: 'A', statementB: 'B', isResolved: true }],
        }) } }],
      });
      const result = await adapter.findContradictions('text');
      expect(result[0].isResolved).toBe(false);
    });
  });

  describe('recommendStructure', () => {
    it('returns chapter recommendations', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({
          chapters: [{ title: 'Chapter 1', beats: [{ content: 'Opening' }] }],
        }) } }],
      });
      const result = await adapter.recommendStructure('text', []);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Chapter 1');
    });

    it('returns empty array on parse error', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'bad json' } }],
      });
      const result = await adapter.recommendStructure('text', []);
      expect(result).toEqual([]);
    });

    it('returns empty array when chapters key is missing', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{}' } }],
      });
      const result = await adapter.recommendStructure('text', []);
      expect(result).toEqual([]);
    });
  });

  describe('chat', () => {
    it('returns the Wombat reply', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Where is the conflict in this story?' } }],
      });
      const reply = await adapter.chat([{ role: 'user', content: 'What do you think?' }], context);
      expect(reply).toBe('Where is the conflict in this story?');
    });

    it('returns fallback message when content is null', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });
      const reply = await adapter.chat([{ role: 'user', content: 'test' }], context);
      // Fallback: "Wombat was speechless. That's a first."
      expect(reply).toContain('speechless');
    });

    it('returns fallback message when choices is empty', async () => {
      mockCreate.mockResolvedValueOnce({ choices: [] });
      const reply = await adapter.chat([{ role: 'user', content: 'test' }], context);
      expect(reply).toContain('speechless');
    });
  });
});
