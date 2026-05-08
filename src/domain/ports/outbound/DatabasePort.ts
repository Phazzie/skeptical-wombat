import { Project } from '../../entities/Project';

export interface DatabasePort {
  save(project: Project): Promise<void>;
  findById(id: string): Promise<Project | null>;
}
