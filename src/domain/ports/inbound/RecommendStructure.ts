import { ChapterRecommendation } from '../outbound/InsightPort';

export interface RecommendStructureCommand {
  projectId: string;
  transcript: string;
}

export interface RecommendStructureUseCase {
  recommendStructure(command: RecommendStructureCommand): Promise<ChapterRecommendation[]>;
}
