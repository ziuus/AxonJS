export interface Tool<TArgs = any, TResult = any> {
  name: string;
  description: string;
  schema?: Record<string, any>; // Simplified generic schema for v0.1
  execute: (args: TArgs) => Promise<TResult> | TResult;
}

export interface AgentConfig {
  llmProvider: 'openai' | 'mock'; // Add more later
  memory?: 'session' | 'none';
}

export interface AgentResponse {
  text: string;
  toolCalls?: { name: string; args: any }[];
}
