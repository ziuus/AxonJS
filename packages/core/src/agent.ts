import { AgentConfig, AgentResponse, Tool } from './types';
import { ToolRegistry } from './tool-registry';

export class Agent {
  private config: AgentConfig;
  public tools: ToolRegistry;

  constructor(config: AgentConfig) {
    this.config = config;
    this.tools = new ToolRegistry();
  }

  /**
   * Helper to register a tool directly on the agent's registry.
   */
  registerTool<TArgs = any, TResult = any>(tool: Tool<TArgs, TResult>) {
    this.tools.register(tool);
  }

  /**
   * Primary method to trigger the agent's reasoning loop.
   */
  async run(prompt: string, context?: any): Promise<AgentResponse> {
    console.log(`[AxonJS] Agent running with prompt: "${prompt}"`);
    console.log(`[AxonJS] Available tools:`, this.tools.getAllTools().map(t => t.name));

    // MOCK LLM IMPLEMENTATION FOR V0.1 LOCAL TESTING
    if (this.config.llmProvider === 'mock') {
       return this.mockRun(prompt, context);
    }

    throw new Error('Only mock provider is implemented in v0.1 playground.');
  }

  /**
   * A mock execution loop for local testing without an API key.
   */
  private async mockRun(prompt: string, context?: any): Promise<AgentResponse> {
    // If the prompt contains the word "navigate", simulate calling a tool
    if (prompt.toLowerCase().includes('navigate')) {
      const toolName = 'navigateToPage';
      if (this.tools.getTool(toolName)) {
         console.log(`[AxonJS Mock LLM] Decided to call tool: ${toolName}`);
         const args = { url: '/dashboard' };
         // In a real scenario, the LLM just returns the tool request.
         // Here in the mock, we'll execute it to show the flow.
         await this.tools.execute(toolName, args);
         return {
           text: "I have navigated you to the dashboard.",
           toolCalls: [{ name: toolName, args }]
         };
      }
    }

    return {
      text: "I am a mock AI agent. I received your prompt but did not trigger any tools."
    };
  }
}

// Factory function
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
