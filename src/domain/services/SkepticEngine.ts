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
    const project = await this.findOrCreateProject(command.projectId);

    if (project.state === ProjectState.DRAFTING) {
      throw new FrictionError('Cannot analyze gaps while in DRAFTING state.');
    }

    const [foundGaps, foundContradictions] = await Promise.all([
      this.insightPort.findGaps(command.newTranscript, command.context),
      this.insightPort.findContradictions(command.newTranscript),
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
