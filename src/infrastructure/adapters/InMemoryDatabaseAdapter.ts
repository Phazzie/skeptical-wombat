import { Project } from '../../domain/entities/Project';
import { DatabasePort } from '../../domain/ports/outbound/DatabasePort';

export class InMemoryDatabaseAdapter implements DatabasePort {
  private projects: Map<string, Project> = new Map();

  async save(project: Project): Promise<void> {
    this.projects.set(project.id, project);
  }

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }
}
