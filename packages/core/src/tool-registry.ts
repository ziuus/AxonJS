import { Tool } from './types';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Registers a new tool that the AI agent can call.
   */
  register<TArgs = any, TResult = any>(tool: Tool<TArgs, TResult>) {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool with name '${tool.name}' is already registered and will be overwritten.`);
    }
    this.tools.set(tool.name, tool as Tool);
  }

  /**
   * Gets a tool by name.
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Gets all registered tools.
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Executes a tool dynamically.
   */
  async execute(name: string, args: any): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry.`);
    }
    return tool.execute(args);
  }
}
