"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Agent: () => Agent,
  ToolRegistry: () => ToolRegistry,
  createAgent: () => createAgent
});
module.exports = __toCommonJS(index_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Agent,
  ToolRegistry,
  createAgent
});
