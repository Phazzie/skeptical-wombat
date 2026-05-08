import { describe, it, expect } from 'vitest';
import { SkepticismScore, TranscriptId } from './ValueObjects';

// ── SkepticismScore ───────────────────────────────────────────────────────────

describe('SkepticismScore', () => {
  it('creates a score of 0', () => {
    const s = SkepticismScore.from(0);
    expect(s.value).toBe(0);
  });

  it('creates a score of 100', () => {
    const s = SkepticismScore.from(100);
    expect(s.value).toBe(100);
  });

  it('creates a score of 50', () => {
    const s = SkepticismScore.from(50);
    expect(s.value).toBe(50);
  });

  it('throws for negative values', () => {
    expect(() => SkepticismScore.from(-1)).toThrow('between 0 and 100');
  });

  it('throws for values above 100', () => {
    expect(() => SkepticismScore.from(101)).toThrow('between 0 and 100');
  });

  it('throws for NaN', () => {
    expect(() => SkepticismScore.from(NaN)).toThrow();
  });
});

// ── TranscriptId ──────────────────────────────────────────────────────────────

describe('TranscriptId', () => {
  it('creates a valid TranscriptId', () => {
    const t = TranscriptId.from('abc-123');
    expect(t.value).toBe('abc-123');
  });

  it('throws for empty string', () => {
    expect(() => TranscriptId.from('')).toThrow('cannot be empty');
  });

  it('throws for whitespace-only string', () => {
    expect(() => TranscriptId.from('   ')).toThrow('cannot be empty');
  });

  it('preserves leading/trailing characters that are not just spaces', () => {
    const t = TranscriptId.from('  abc  ');
    // value is stored as-is (trim check is only for guards)
    expect(t.value).toBe('  abc  ');
  });
});
