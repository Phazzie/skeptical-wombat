import { createHash } from 'crypto';
import { AnalyzeBullshitUseCase, AnalyzeBullshitCommand } from '../ports/inbound/AnalyzeBullshit';
import { ChatWithWombatUseCase, ChatWithWombatCommand } from '../ports/inbound/ChatWithWombat';
import { RecommendStructureUseCase, RecommendStructureCommand } from '../ports/inbound/RecommendStructure';
import { ChapterRecommendation, InsightPort } from '../ports/outbound/InsightPort';
import { DatabasePort } from '../ports/outbound/DatabasePort';
import { IdGeneratorPort } from '../ports/outbound/IdGeneratorPort';
import { ProjectState } from '../entities/ProjectState';
import { FrictionError } from '../entities/FrictionError';
import { Project } from '../entities/Project';

export class SkepticEngine
  implements AnalyzeBullshitUseCase, ChatWithWombatUseCase, RecommendStructureUseCase
{
  constructor(
    private readonly insightPort: InsightPort,
    private readonly databasePort: DatabasePort,
    private readonly idGenerator: IdGeneratorPort
  ) {}

  private async findOrCreateProject(projectId: string): Promise<Project> {
    const existing = await this.databasePort.findById(projectId);
    if (existing) return existing;
    return Project.create(projectId);
  }

  async analyze(command: AnalyzeBullshitCommand): Promise<void> {
    const { newTranscript } = command;
    const project = await this.findOrCreateProject(command.projectId);

    const transcriptHash = createHash('sha256').update(newTranscript).digest('hex');

    if (project.lastAnalyzedHash === transcriptHash) {
      return; // Same transcript — skip redundant Grok calls
    }

    if (project.state === ProjectState.DRAFTING) {
      throw new FrictionError('Cannot analyze gaps while in DRAFTING state.');
    }

    const analysisText = newTranscript.length > 8000
      ? newTranscript.slice(-8000)
      : newTranscript;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 240_000);
    try {
      const [foundGaps, foundContradictions] = await Promise.all([
        this.insightPort.findGaps(analysisText, command.context),
        this.insightPort.findContradictions(analysisText),
      ]);

      for (const gap of foundGaps) {
        project.addGap({
          id: this.idGenerator.generateId(),
          description: gap.description,
          isResolved: gap.isResolved,
        });
      }

      for (const contradiction of foundContradictions) {
        project.addContradiction({
          id: this.idGenerator.generateId(),
          statementA: contradiction.statementA,
          statementB: contradiction.statementB,
          isResolved: contradiction.isResolved,
        });
      }

      if (project.state !== ProjectState.CONFRONTING) {
        project.transitionTo(ProjectState.CONFRONTING);
      }

      project.setLastAnalyzedHash(transcriptHash);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Analysis timed out — try a shorter transcript or split into sections');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    await this.databasePort.save(project);
  }

  async recommendStructure(command: RecommendStructureCommand): Promise<ChapterRecommendation[]> {
    const project = await this.databasePort.findById(command.projectId);
    if (!project) throw new Error('Project not found');

    return this.insightPort.recommendStructure(command.transcript, project.chapters);
  }

  async chatWithWombat(command: ChatWithWombatCommand): Promise<string> {
    const project = await this.databasePort.findById(command.projectId);
    if (!project) throw new Error('Project not found');

    return this.insightPort.chat(command.messages, command.context);
  }
}
