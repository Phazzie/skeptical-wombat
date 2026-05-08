import { describe, it, expect } from 'vitest';
import { FrictionError } from './FrictionError';

describe('FrictionError', () => {
  it('is an instance of Error', () => {
    const e = new FrictionError('Something blocked.');
    expect(e).toBeInstanceOf(Error);
  });

  it('is an instance of FrictionError (prototype chain preserved)', () => {
    const e = new FrictionError('Cannot proceed.');
    expect(e).toBeInstanceOf(FrictionError);
  });

  it('has the correct name', () => {
    const e = new FrictionError('Test');
    expect(e.name).toBe('FrictionError');
  });

  it('carries the provided message', () => {
    const msg = 'Cannot transition to DRAFTING with unresolved Gaps.';
    const e = new FrictionError(msg);
    expect(e.message).toBe(msg);
  });

  it('can be caught as Error', () => {
    expect(() => {
      throw new FrictionError('boom');
    }).toThrow(Error);
  });

  it('can be caught as FrictionError specifically', () => {
    expect(() => {
      throw new FrictionError('boom');
    }).toThrow(FrictionError);
  });
});
