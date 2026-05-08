import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkepticEngine } from './SkepticEngine';
import { InsightPort, ChapterRecommendation, ChatMessage, ContextConfig } from '../ports/outbound/InsightPort';
import { DatabasePort } from '../ports/outbound/DatabasePort';
import { IdGeneratorPort } from '../ports/outbound/IdGeneratorPort';
import { Project } from '../entities/Project';
import { ProjectState } from '../entities/ProjectState';
import { FrictionError } from '../entities/FrictionError';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeInsightPort(overrides: Partial<InsightPort> = {}): InsightPort {
  return {
    findGaps: vi.fn().mockResolvedValue([]),
    findContradictions: vi.fn().mockResolvedValue([]),
    recommendStructure: vi.fn().mockResolvedValue([]),
    chat: vi.fn().mockResolvedValue('Wombat says hello'),
    ...overrides,
  };
}

function makeDatabasePort(project: Project | null = null): DatabasePort {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(project),
  };
}

function makeIdGenerator(id = 'mock-id'): IdGeneratorPort {
  return { generateId: vi.fn().mockReturnValue(id) };
}

const context: ContextConfig = { format: 'Book', title: 'My Story', part: 'Chapter 1' };

// ── analyze ───────────────────────────────────────────────────────────────────

describe('SkepticEngine.analyze', () => {
  let project: Project;
  let insightPort: InsightPort;
  let databasePort: DatabasePort;
  let idGenerator: IdGeneratorPort;
  let engine: SkepticEngine;

  beforeEach(() => {
    project = Project.create('proj-1');
    insightPort = makeInsightPort({
      findGaps: vi.fn().mockResolvedValue([
        { description: 'Why did you quit?', isResolved: false },
      ]),
      findContradictions: vi.fn().mockResolvedValue([
        { statementA: 'I loved it.', statementB: 'I hated every minute.', isResolved: false },
      ]),
    });
    databasePort = makeDatabasePort(project);
    idGenerator = makeIdGenerator('test-id');
    engine = new SkepticEngine(insightPort, databasePort, idGenerator);
  });

  it('adds gaps, contradictions and transitions state to CONFRONTING', async () => {
    await engine.analyze({ projectId: 'proj-1', newTranscript: 'Some text', context });

    expect(project.gaps).toHaveLength(1);
    expect(project.gaps[0].description).toBe('Why did you quit?');
    expect(project.gaps[0].id).toBe('test-id');

    expect(project.contradictions).toHaveLength(1);
    expect(project.contradictions[0].statementA).toBe('I loved it.');
    expect(project.contradictions[0].id).toBe('test-id');

    expect(project.state).toBe(ProjectState.CONFRONTING);
    expect(databasePort.save).toHaveBeenCalledWith(project);
  });

  it('calls both findGaps and findContradictions concurrently', async () => {
    await engine.analyze({ projectId: 'proj-1', newTranscript: 'Text', context });
    expect(insightPort.findGaps).toHaveBeenCalledOnce();
    expect(insightPort.findContradictions).toHaveBeenCalledOnce();
  });

  it('creates a new project when none exists in the database', async () => {
    const dbPort = makeDatabasePort(null); // no existing project
    const eng = new SkepticEngine(insightPort, dbPort, idGenerator);
    await expect(
      eng.analyze({ projectId: 'new-proj', newTranscript: 'Text', context })
    ).resolves.not.toThrow();
    expect(dbPort.save).toHaveBeenCalledOnce();
  });

  it('throws FrictionError when project is in DRAFTING state', async () => {
    project.transitionTo(ProjectState.DRAFTING);
    await expect(
      engine.analyze({ projectId: 'proj-1', newTranscript: 'Text', context })
    ).rejects.toThrow(FrictionError);
  });

  it('does not save when in DRAFTING state', async () => {
    project.transitionTo(ProjectState.DRAFTING);
    await engine.analyze({ projectId: 'proj-1', newTranscript: 'Text', context }).catch(() => {});
    expect(databasePort.save).not.toHaveBeenCalled();
  });
});

// ── recommendStructure ────────────────────────────────────────────────────────

describe('SkepticEngine.recommendStructure', () => {
  it('returns chapter recommendations from the insight port', async () => {
    const recs: ChapterRecommendation[] = [
      { title: 'The Beginning', beats: [{ content: 'Prologue' }] },
    ];
    const project = Project.create('proj-2');
    const engine = new SkepticEngine(
      makeInsightPort({ recommendStructure: vi.fn().mockResolvedValue(recs) }),
      makeDatabasePort(project),
      makeIdGenerator()
    );

    const result = await engine.recommendStructure({ projectId: 'proj-2', transcript: 'Draft text' });
    expect(result).toEqual(recs);
  });

  it('throws when project does not exist', async () => {
    const engine = new SkepticEngine(makeInsightPort(), makeDatabasePort(null), makeIdGenerator());
    await expect(
      engine.recommendStructure({ projectId: 'ghost', transcript: 'text' })
    ).rejects.toThrow('not found');
  });
});

// ── chatWithWombat ────────────────────────────────────────────────────────────

describe('SkepticEngine.chatWithWombat', () => {
  const messages: ChatMessage[] = [{ role: 'user', content: 'What is the theme?' }];

  it('returns a reply from the insight port', async () => {
    const project = Project.create('proj-3');
    const engine = new SkepticEngine(
      makeInsightPort({ chat: vi.fn().mockResolvedValue('The theme is hubris.') }),
      makeDatabasePort(project),
      makeIdGenerator()
    );

    const reply = await engine.chatWithWombat({ projectId: 'proj-3', messages, context });
    expect(reply).toBe('The theme is hubris.');
  });

  it('throws when project does not exist', async () => {
    const engine = new SkepticEngine(makeInsightPort(), makeDatabasePort(null), makeIdGenerator());
    await expect(
      engine.chatWithWombat({ projectId: 'ghost', messages, context })
    ).rejects.toThrow('not found');
  });
});
