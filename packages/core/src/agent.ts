import { AgentConfig, AgentResponse, Tool } from './types';
import { ToolRegistry } from './tool-registry';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

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
  registerTool<TArgs extends z.ZodTypeAny = any, TResult = any>(tool: Tool<TArgs, TResult>) {
    this.tools.register(tool);
  }

  /**
   * Primary method to trigger the agent's reasoning loop.
   */
  async run(prompt: string, context?: any): Promise<AgentResponse> {
    console.log(`[AxonJS] Agent running with prompt: "${prompt}"`);

    if (this.config.llmProvider === 'openai') {
      if (!this.config.apiKey) {
        throw new Error('AxonJS Error: OpenAPI key is missing in config.');
      }
      return this.runOpenAI(prompt, context);
    }

    throw new Error(`Provider ${this.config.llmProvider} is not implemented yet.`);
  }

  /**
   * Translates the Axon Tool Registry into the format expected by the AI SDK.
   */
  private getAITools() {
    const aiTools: Record<string, any> = {};
    for (const tool of this.tools.getAllTools()) {
      aiTools[tool.name] = {
        description: tool.description,
        parameters: tool.schema,
      };
    }
    return aiTools;
  }

  /**
   * The real execution loop using OpenAI via the AI SDK.
   */
  private async runOpenAI(prompt: string, context?: any): Promise<AgentResponse> {
    const openai = createOpenAI({
      apiKey: this.config.apiKey,
    });

    const response = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You are an intelligent frontend application agent. You have access to tools that control the application state and UI. Use them to fulfill the user request.',
      prompt: prompt,
      tools: this.getAITools(),
    });

    // Execute the tools the AI requested locally
    const toolCallsFromLLM: { name: string; args: any }[] = [];
    
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const call of response.toolCalls) {
        // The AI SDK types toolCalls.args as unknown if the schema isn't inferred perfectly
        // We cast it so we can push it to our log and validator
        const args = (call as any).args || {};
        toolCallsFromLLM.push({ name: call.toolName, args });
        // Let our registry validate and execute the tool
        try {
          await this.tools.execute(call.toolName, args);
        } catch (error) {
           console.error(`[AxonJS] Error executing tool ${call.toolName}:`, error);
        }
      }
    }

    return {
      text: response.text,
      toolCalls: toolCallsFromLLM,
    };
  }
}

// Factory function
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
