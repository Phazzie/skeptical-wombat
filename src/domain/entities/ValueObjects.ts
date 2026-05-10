export class SkepticismScore {
  private constructor(public readonly value: number) {}

  static from(value: number): SkepticismScore {
    if (isNaN(value) || value < 0 || value > 100) {
      throw new Error('SkepticismScore must be between 0 and 100.');
    }
    return new SkepticismScore(value);
  }
}

export class TranscriptId {
  private constructor(public readonly value: string) {}

  static from(value: string): TranscriptId {
    if (!value.trim()) {
      throw new Error('TranscriptId cannot be empty.');
    }
    return new TranscriptId(value);
  }
}
