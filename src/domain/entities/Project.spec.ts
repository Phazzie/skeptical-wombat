import { describe, it, expect } from 'vitest';
import { Project, Beat, Chapter } from './Project';
import { ProjectState } from './ProjectState';
import { FrictionError } from './FrictionError';
import { Gap } from './Gap';
import { Contradiction } from './Contradiction';

// ── Factory helpers ───────────────────────────────────────────────────────────

function gap(id: string, description: string, isResolved = false): Gap {
  return { id, description, isResolved };
}

function contradiction(id: string, a: string, b: string, isResolved = false): Contradiction {
  return { id, statementA: a, statementB: b, isResolved };
}

function beat(id: string, content: string): Beat {
  return { id, content };
}

// ── Project.create ────────────────────────────────────────────────────────────

describe('Project.create', () => {
  it('creates a project in EXCAVATING state with default chapter', () => {
    const p = Project.create('p1');
    expect(p.id).toBe('p1');
    expect(p.state).toBe(ProjectState.EXCAVATING);
    expect(p.gaps).toHaveLength(0);
    expect(p.contradictions).toHaveLength(0);
    expect(p.chapters).toHaveLength(1);
    expect(p.chapters[0].title).toBe('Chapter 1');
    expect(p.score).toBe(50);
  });
});

// ── Project.restore ───────────────────────────────────────────────────────────

describe('Project.restore', () => {
  it('restores a project from persisted values', () => {
    const chapters: Chapter[] = [{ id: 'ch1', title: 'Intro', beats: [] }];
    const p = Project.restore('p2', ProjectState.CONFRONTING, [], [], 70, chapters);
    expect(p.id).toBe('p2');
    expect(p.state).toBe(ProjectState.CONFRONTING);
    expect(p.score).toBe(70);
    expect(p.chapters).toHaveLength(1);
  });
});

// ── addGap / resolveGap ───────────────────────────────────────────────────────

describe('Project gap management', () => {
  it('addGap appends a gap', () => {
    const p = Project.create('p3');
    p.addGap(gap('g1', 'Missing motivation'));
    expect(p.gaps).toHaveLength(1);
    expect(p.gaps[0].description).toBe('Missing motivation');
  });

  it('resolveGap marks the gap as resolved', () => {
    const p = Project.create('p4');
    p.addGap(gap('g1', 'Unclear timeline'));
    p.resolveGap('g1');
    expect(p.gaps[0].isResolved).toBe(true);
  });

  it('resolveGap on unknown id does nothing', () => {
    const p = Project.create('p5');
    p.addGap(gap('g1', 'desc'));
    p.resolveGap('does-not-exist');
    expect(p.gaps[0].isResolved).toBe(false);
  });
});

// ── addContradiction / resolveContradiction ───────────────────────────────────

describe('Project contradiction management', () => {
  it('addContradiction appends a contradiction', () => {
    const p = Project.create('p6');
    p.addContradiction(contradiction('c1', 'Loved it', 'Hated it'));
    expect(p.contradictions).toHaveLength(1);
  });

  it('resolveContradiction marks it resolved', () => {
    const p = Project.create('p7');
    p.addContradiction(contradiction('c1', 'A', 'B'));
    p.resolveContradiction('c1');
    expect(p.contradictions[0].isResolved).toBe(true);
  });

  it('resolveContradiction on unknown id does nothing', () => {
    const p = Project.create('p8');
    p.addContradiction(contradiction('c1', 'A', 'B'));
    p.resolveContradiction('nope');
    expect(p.contradictions[0].isResolved).toBe(false);
  });
});

// ── transitionTo ─────────────────────────────────────────────────────────────

describe('Project.transitionTo', () => {
  it('transitions from EXCAVATING to CONFRONTING freely', () => {
    const p = Project.create('p9');
    p.transitionTo(ProjectState.CONFRONTING);
    expect(p.state).toBe(ProjectState.CONFRONTING);
  });

  it('allows DRAFTING when all gaps and contradictions are resolved', () => {
    const p = Project.create('p10');
    p.addGap(gap('g1', 'desc'));
    p.addContradiction(contradiction('c1', 'A', 'B'));
    p.resolveGap('g1');
    p.resolveContradiction('c1');
    p.transitionTo(ProjectState.DRAFTING);
    expect(p.state).toBe(ProjectState.DRAFTING);
  });

  it('throws FrictionError when transitioning to DRAFTING with unresolved gaps', () => {
    const p = Project.create('p11');
    p.addGap(gap('g1', 'Unresolved'));
    expect(() => p.transitionTo(ProjectState.DRAFTING)).toThrow(FrictionError);
  });

  it('throws FrictionError when transitioning to DRAFTING with unresolved contradictions', () => {
    const p = Project.create('p12');
    p.addContradiction(contradiction('c1', 'A', 'B'));
    expect(() => p.transitionTo(ProjectState.DRAFTING)).toThrow(FrictionError);
  });

  it('allows DRAFTING from an empty project with no gaps or contradictions', () => {
    const p = Project.create('p13');
    expect(() => p.transitionTo(ProjectState.DRAFTING)).not.toThrow();
    expect(p.state).toBe(ProjectState.DRAFTING);
  });
});

// ── setChapters ───────────────────────────────────────────────────────────────

describe('Project.setChapters', () => {
  it('replaces chapters via domain method', () => {
    const p = Project.create('p14');
    const newChapters: Chapter[] = [
      { id: 'ch-new', title: 'New Chapter', beats: [{ id: 'b1', content: 'Opening' }] },
    ];
    p.setChapters(newChapters);
    expect(p.chapters).toHaveLength(1);
    expect(p.chapters[0].title).toBe('New Chapter');
  });
});

// ── addBeat / moveBeat ────────────────────────────────────────────────────────

describe('Project beat management', () => {
  it('addBeat appends a beat to the correct chapter', () => {
    const p = Project.create('p15');
    const chapterId = p.chapters[0].id;
    p.addBeat(chapterId, beat('b1', 'First beat'));
    expect(p.chapters[0].beats).toHaveLength(1);
    expect(p.chapters[0].beats[0].content).toBe('First beat');
  });

  it('addBeat to unknown chapter does nothing', () => {
    const p = Project.create('p16');
    p.addBeat('nonexistent', beat('b1', 'Orphan beat'));
    expect(p.chapters[0].beats).toHaveLength(0);
  });

  it('moveBeat relocates a beat between chapters', () => {
    const p = Project.create('p17');
    p.addChapter('Chapter 2', 'ch2');
    const ch1Id = p.chapters[0].id;
    p.addBeat(ch1Id, beat('b1', 'Beat to move'));

    p.moveBeat('b1', ch1Id, 'ch2', 0);

    expect(p.chapters[0].beats).toHaveLength(0);
    expect(p.chapters[1].beats).toHaveLength(1);
    expect(p.chapters[1].beats[0].id).toBe('b1');
  });

  it('moveBeat with unknown beatId does nothing', () => {
    const p = Project.create('p18');
    const ch1Id = p.chapters[0].id;
    p.addChapter('Chapter 2', 'ch2');
    p.moveBeat('ghost', ch1Id, 'ch2', 0);
    expect(p.chapters[1].beats).toHaveLength(0);
  });
});

// ── addChapter ────────────────────────────────────────────────────────────────

describe('Project.addChapter', () => {
  it('appends a chapter with an empty beats array', () => {
    const p = Project.create('p19');
    p.addChapter('Epilogue', 'ch-epilogue');
    expect(p.chapters).toHaveLength(2);
    expect(p.chapters[1].title).toBe('Epilogue');
    expect(p.chapters[1].beats).toHaveLength(0);
  });
});
