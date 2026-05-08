import { ContextConfig, ChatMessage } from '../outbound/InsightPort';

export interface ChatWithWombatCommand {
  projectId: string;
  messages: ChatMessage[];
  context: ContextConfig;
}

export interface ChatWithWombatUseCase {
  chatWithWombat(command: ChatWithWombatCommand): Promise<string>;
}
