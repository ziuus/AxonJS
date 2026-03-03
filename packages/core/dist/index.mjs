// src/tool-registry.ts
var ToolRegistry = class {
  tools = /* @__PURE__ */ new Map();
  /**
   * Registers a new tool that the AI agent can call.
   */
  register(tool) {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool with name '${tool.name}' is already registered and will be overwritten.`);
    }
    this.tools.set(tool.name, tool);
  }
  /**
   * Gets a tool by name.
   */
  getTool(name) {
    return this.tools.get(name);
  }
  /**
   * Gets all registered tools.
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }
  /**
   * Executes a tool dynamically.
   */
  async execute(name, args) {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry.`);
    }
    return tool.execute(args);
  }
};

// src/agent.ts
var Agent = class {
  config;
  tools;
  constructor(config) {
    this.config = config;
    this.tools = new ToolRegistry();
  }
  /**
   * Helper to register a tool directly on the agent's registry.
   */
  registerTool(tool) {
    this.tools.register(tool);
  }
  /**
   * Primary method to trigger the agent's reasoning loop.
   */
  async run(prompt, context) {
    console.log(`[AxonJS] Agent running with prompt: "${prompt}"`);
    console.log(`[AxonJS] Available tools:`, this.tools.getAllTools().map((t) => t.name));
    if (this.config.llmProvider === "mock") {
      return this.mockRun(prompt, context);
    }
    throw new Error("Only mock provider is implemented in v0.1 playground.");
  }
  /**
   * A mock execution loop for local testing without an API key.
   */
  async mockRun(prompt, context) {
    if (prompt.toLowerCase().includes("navigate")) {
      const toolName = "navigateToPage";
      if (this.tools.getTool(toolName)) {
        console.log(`[AxonJS Mock LLM] Decided to call tool: ${toolName}`);
        const args = { url: "/dashboard" };
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
};
function createAgent(config) {
  return new Agent(config);
}
export {
  Agent,
  ToolRegistry,
  createAgent
};
