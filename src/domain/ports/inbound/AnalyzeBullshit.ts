export interface ContextConfig {
  format: string;
  title: string;
  part: string;
}

export interface AnalyzeBullshitCommand {
  projectId: string;
  newTranscript: string;
  context: ContextConfig;
}

export interface AnalyzeBullshitUseCase {
  analyze(command: AnalyzeBullshitCommand): Promise<void>;
}
