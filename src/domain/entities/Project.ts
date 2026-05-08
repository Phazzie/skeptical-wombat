import { Gap } from './Gap';
import { Contradiction } from './Contradiction';
import { ProjectState } from './ProjectState';
import { FrictionError } from './FrictionError';
import { SkepticismScore } from './ValueObjects';

export interface Beat {
  id: string;
  content: string;
}

export interface Chapter {
  id: string;
  title: string;
  beats: Beat[];
}

export class Project {
  private constructor(
    public readonly id: string,
    public state: ProjectState,
    public gaps: Gap[],
    public contradictions: Contradiction[],
    private _score: SkepticismScore,
    public chapters: Chapter[]
  ) {}

  static create(id: string): Project {
    return new Project(
      id,
      ProjectState.EXCAVATING,
      [],
      [],
      SkepticismScore.from(50),
      [{ id: 'default-chapter', title: 'Chapter 1', beats: [] }]
    );
  }

  static restore(
    id: string,
    state: ProjectState,
    gaps: Gap[],
    contradictions: Contradiction[],
    score: number,
    chapters: Chapter[]
  ): Project {
    return new Project(id, state, gaps, contradictions, SkepticismScore.from(score), chapters);
  }

  public get score(): number {
    return this._score.value;
  }

  public setScore(score: SkepticismScore): void {
    this._score = score;
  }

  public setChapters(chapters: Chapter[]): void {
    this.chapters = chapters;
  }

  addGap(gap: Gap): void {
    this.gaps.push(gap);
  }

  addContradiction(contradiction: Contradiction): void {
    this.contradictions.push(contradiction);
  }

  resolveGap(gapId: string): void {
    const gap = this.gaps.find(g => g.id === gapId);
    if (gap) gap.isResolved = true;
  }

  resolveContradiction(contradictionId: string): void {
    const contradiction = this.contradictions.find(c => c.id === contradictionId);
    if (contradiction) contradiction.isResolved = true;
  }

  transitionTo(newState: ProjectState): void {
    if (newState === ProjectState.DRAFTING) {
      const unresolvedGaps = this.gaps.filter(g => !g.isResolved);
      if (unresolvedGaps.length > 0) {
        throw new FrictionError('Cannot transition to DRAFTING with unresolved Gaps.');
      }
      const unresolvedContradictions = this.contradictions.filter(c => !c.isResolved);
      if (unresolvedContradictions.length > 0) {
        throw new FrictionError('Cannot transition to DRAFTING with unresolved Contradictions.');
      }
    }
    this.state = newState;
  }

  addBeat(chapterId: string, beat: Beat): void {
    const chapter = this.chapters.find(c => c.id === chapterId);
    if (chapter) {
      chapter.beats.push(beat);
    }
  }

  moveBeat(beatId: string, fromChapterId: string, toChapterId: string, toIndex: number): void {
    const fromChapter = this.chapters.find(c => c.id === fromChapterId);
    const toChapter = this.chapters.find(c => c.id === toChapterId);

    if (fromChapter && toChapter) {
      const beatIndex = fromChapter.beats.findIndex(b => b.id === beatId);
      if (beatIndex !== -1) {
        const [beat] = fromChapter.beats.splice(beatIndex, 1);
        toChapter.beats.splice(toIndex, 0, beat);
      }
    }
  }

  addChapter(title: string, id: string): void {
    this.chapters.push({ id, title, beats: [] });
  }
}
