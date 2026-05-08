import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDatabaseAdapter } from './InMemoryDatabaseAdapter';
import { Project } from '../../domain/entities/Project';

describe('InMemoryDatabaseAdapter', () => {
  let adapter: InMemoryDatabaseAdapter;

  beforeEach(() => {
    adapter = new InMemoryDatabaseAdapter();
  });

  it('returns null for an unknown project id', async () => {
    const result = await adapter.findById('unknown');
    expect(result).toBeNull();
  });

  it('saves a project and retrieves it by id', async () => {
    const p = Project.create('user-1');
    await adapter.save(p);
    const found = await adapter.findById('user-1');
    expect(found).toBe(p);
  });

  it('overwrites an existing project on subsequent saves', async () => {
    const p = Project.create('user-2');
    await adapter.save(p);

    // Mutate then re-save
    p.addGap({ id: 'g1', description: 'A gap', isResolved: false });
    await adapter.save(p);

    const found = await adapter.findById('user-2');
    expect(found?.gaps).toHaveLength(1);
  });

  it('stores multiple projects independently', async () => {
    const p1 = Project.create('u1');
    const p2 = Project.create('u2');
    await adapter.save(p1);
    await adapter.save(p2);

    expect(await adapter.findById('u1')).toBe(p1);
    expect(await adapter.findById('u2')).toBe(p2);
  });
});
