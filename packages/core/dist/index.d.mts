interface Tool<TArgs = any, TResult = any> {
    name: string;
    description: string;
    schema?: Record<string, any>;
    execute: (args: TArgs) => Promise<TResult> | TResult;
}
interface AgentConfig {
    llmProvider: 'openai' | 'mock';
    memory?: 'session' | 'none';
}
interface AgentResponse {
    text: string;
    toolCalls?: {
        name: string;
        args: any;
    }[];
}

declare class ToolRegistry {
    private tools;
    /**
     * Registers a new tool that the AI agent can call.
     */
    register<TArgs = any, TResult = any>(tool: Tool<TArgs, TResult>): void;
    /**
     * Gets a tool by name.
     */
    getTool(name: string): Tool | undefined;
    /**
     * Gets all registered tools.
     */
    getAllTools(): Tool[];
    /**
     * Executes a tool dynamically.
     */
    execute(name: string, args: any): Promise<any>;
}

declare class Agent {
    private config;
    tools: ToolRegistry;
    constructor(config: AgentConfig);
    /**
     * Helper to register a tool directly on the agent's registry.
     */
    registerTool<TArgs = any, TResult = any>(tool: Tool<TArgs, TResult>): void;
    /**
     * Primary method to trigger the agent's reasoning loop.
     */
    run(prompt: string, context?: any): Promise<AgentResponse>;
    /**
     * A mock execution loop for local testing without an API key.
     */
    private mockRun;
}
declare function createAgent(config: AgentConfig): Agent;

export { Agent, type AgentConfig, type AgentResponse, type Tool, ToolRegistry, createAgent };
