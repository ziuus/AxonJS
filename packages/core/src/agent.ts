import { zodToJsonSchema } from 'zod-to-json-schema';
import { jsonSchema, generateText, tool as aiTool } from 'ai';
import { AgentConfig, AgentResponse, Tool, CoreMessage } from './types';
import { ToolRegistry } from './tool-registry';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';

export class Agent {
  private config: AgentConfig;
  public tools: ToolRegistry;

  constructor(config: AgentConfig) {
    this.config = config;
    this.tools = new ToolRegistry();

    // Automatically inject the universal Unbounded UI tool
    this.tools.register({
      name: 'interactWithScreen',
      description: 'Interact with the user interface. You MUST provide the exact "elementId" from the current DOM state, an "action" (click/type), and a "value" if typing.',
      schema: z.object({
        elementId: z.string(),
        action: z.enum(['click', 'type']),
        value: z.string().optional()
      }) as any,
      execute: async ({ elementId, action, value }: any) => {
        return {
          _axonSignal: 'UI_INTERACTION',
          payload: { elementId, action, value }
        };
      }
    });

    // Automatically inject the universal 3D Scene tool
    this.tools.register({
      name: 'interactWith3DScene',
      description: 'Interact with a 3D scene embedded in the application. You MUST provide the "sceneId", "actionType" (emitEvent or setVariable), the "target" (the object name or variable name), and an optional "value" if setting a variable.',
      schema: z.object({
        sceneId: z.string().describe('The ID or name of the 3D scene canvas'),
        actionType: z.enum(['emitEvent', 'setVariable']).describe('The kind of operation to perform'),
        target: z.string().describe('The exact name of the object (for events) or variable (for variables)'),
        value: z.union([z.string(), z.number()]).optional().describe('The new value if actionType is setVariable, ignored otherwise')
      }) as any,
      execute: async ({ sceneId, actionType, target, value }: any) => {
        return {
          _axonSignal: '3D_INTERACTION',
          payload: { sceneId, actionType, target, value }
        };
      }
    });

    // ── NEW HIGH-LEVEL INTEGRATIONS ─────────────────────────────────────────

    // 1. READ text/value from any DOM element by ID
    this.tools.register({
      name: 'readScreenText',
      description: 'Read the current text content or value of any DOM element by its ID. Use this when the user asks about state, counts, values, or any displayed information.',
      schema: z.object({
        elementId: z.string().describe('The exact ID of the element to read'),
      }) as any,
      execute: async ({ elementId }: any) => {
        return {
          _axonSignal: 'READ_ELEMENT',
          payload: { elementId }
        };
      }
    });

    // 2. NAVIGATE to another URL or route
    this.tools.register({
      name: 'navigateTo',
      description: 'Navigate the browser to a different page, route, or URL. Use when the user asks to go to a different page, section, or route.',
      schema: z.object({
        url: z.string().describe('The URL or relative path to navigate to, e.g. "/about" or "https://example.com"'),
        newTab: z.boolean().optional().describe('If true, open the URL in a new browser tab'),
      }) as any,
      execute: async ({ url, newTab }: any) => {
        return {
          _axonSignal: 'NAVIGATE',
          payload: { url, newTab }
        };
      }
    });

    // 3. FILL FORM — set multiple input fields at once
    this.tools.register({
      name: 'fillForm',
      description: 'Fill multiple form fields at once. Provide a list of { elementId, value } pairs to populate inputs, textareas, or selects efficiently.',
      schema: z.object({
        fields: z.array(z.object({
          elementId: z.string().describe('The ID of the input element'),
          value: z.string().describe('The value to set in the field'),
        })).describe('List of fields to fill'),
      }) as any,
      execute: async ({ fields }: any) => {
        return {
          _axonSignal: 'FILL_FORM',
          payload: { fields }
        };
      }
    });

    // 4. SHOW NOTIFICATION — display a toast/banner message visible to the user
    this.tools.register({
      name: 'showNotification',
      description: 'Display a toast notification or alert message to the user. Use to confirm actions, report results, or communicate status updates.',
      schema: z.object({
        message: z.string().describe('The message to display in the notification'),
        type: z.enum(['success', 'error', 'info', 'warning']).optional().describe('The visual style of the notification'),
        durationMs: z.number().optional().describe('How many milliseconds to display the notification (default: 3000)'),
      }) as any,
      execute: async ({ message, type, durationMs }: any) => {
        return {
          _axonSignal: 'SHOW_NOTIFICATION',
          payload: { message, type: type || 'info', durationMs: durationMs || 3000 }
        };
      }
    });

    // 5. OBSERVE STATE — ask JS to evaluate an expression and get back a value
    this.tools.register({
      name: 'observeState',
      description: 'Evaluate a specific element\'s property or attribute to read runtime state. For example, get the text of an element, check if a checkbox is checked, or read the current value of a select.',
      schema: z.object({
        elementId: z.string().describe('The DOM element ID to inspect'),
        property: z.string().optional().describe('The DOM property to read, e.g. "textContent", "value", "checked", "href". Defaults to "textContent".'),
      }) as any,
      execute: async ({ elementId, property }: any) => {
        return {
          _axonSignal: 'OBSERVE_STATE',
          payload: { elementId, property: property || 'textContent' }
        };
      }
    });
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
  async run(messages: CoreMessage[], context?: any): Promise<AgentResponse> {
    console.log(`[AxonJS] AGENT VERSION 2.0.0-FIX running with ${messages.length} messages`);

    if (!this.config.apiKey && this.config.llmProvider !== 'mock') {
        throw new Error(`AxonJS Error: OpenAPI/Gemini key is missing in config.`);
    }

    if (this.config.llmProvider === 'openai') {
      return this.runOpenAI(messages, context);
    }

    if (this.config.llmProvider === 'gemini') {
      return this.runGemini(messages, context);
    }

    if (this.config.llmProvider === 'groq') {
      return this.runGroq(messages, context);
    }

    throw new Error(`Provider ${this.config.llmProvider} is not implemented yet.`);
  }

  /**
   * Translates the Axon Tool Registry into the format expected by the AI SDK.
   */
  private getAITools() {
    const aiTools: Record<string, any> = {};
    for (const t of this.tools.getAllTools()) {
      aiTools[t.name] = (aiTool as any)({
        description: t.description,
        parameters: t.schema || z.object({}).passthrough(),
        execute: async (args: any) => {
          console.log(`[AxonJS] Tool Executing: ${t.name} | Args:`, JSON.stringify(args));
          return await this.tools.execute(t.name, args);
        }
      });
    }
    return aiTools;
  }

  /**
   * The semantic execution loop using Google Gemini via the AI SDK.
   */
  private async runGemini(messages: CoreMessage[], context?: any): Promise<AgentResponse> {
    const google = createGoogleGenerativeAI({
      apiKey: this.config.apiKey,
    });

    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list.
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
If the DOM state contains 'type: 3d-scene', you can use the 'interactWith3DScene' tool to trigger its available events or variables.
Always respond to the user after performing actions.`;

    const response = await (generateText as any)({
      model: google(this.config.model || 'gemini-2.5-flash'),
      system: this.config.systemPrompt || defaultSystem,
      messages: messages as any,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5,
    });

    const allToolCalls = (response.steps || []).flatMap((step: any) => 
       (step.toolCalls || []).map((tc: any) => ({ name: tc.toolName, args: tc.args }))
    );

    return { 
      text: response.text.trim(), 
      toolCalls: allToolCalls 
    };
  }

  /**
   * The semantic execution loop using Groq via the AI SDK.
   */

  /**
   * The semantic execution loop using Groq via the AI SDK.
   */
  private async runGroq(messages: CoreMessage[], context?: any): Promise<AgentResponse> {
    const rawTools = this.tools.getAllTools();
    const groq = createOpenAI({
      apiKey: this.config.apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      fetch: async (url, options) => {
        if (!options?.body) return fetch(url, options);
        try {
          const body = JSON.parse(options.body as string);
          if (body.tools) {
            body.tools = body.tools.map((t: any) => {
              if (t.type === 'function' && t.function && t.function.name) {
                const toolDef = rawTools.find(rt => rt.name === t.function.name);
                if (toolDef && toolDef.schema) {
                  const correctSchema = zodToJsonSchema(toolDef.schema as any) as any;
                  delete correctSchema['$schema'];
                  console.log(`[AxonJS SDK Fix] Replacing ${t.function.name} schema. Original:`, JSON.stringify(t.function.parameters), 'New:', JSON.stringify(correctSchema));
                  t.function.parameters = correctSchema;
                }
              }
              return t;
            });
          }
          options.body = JSON.stringify(body);
        } catch (e) {
          console.error('[AxonJS] Fetch Interceptor JSON Parse Error:', e);
        }
        return fetch(url, options);
      }
    });

    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
If the DOM state contains 'type: 3d-scene', you can use the 'interactWith3DScene' tool to trigger its available events or variables.
Always respond to the user after performing actions.`;

    const response = await (generateText as any)({
      model: groq(this.config.model || 'llama-3.3-70b-versatile'),
      system: this.config.systemPrompt || defaultSystem,
      messages: messages as any,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5,
    });

    const allToolCalls = (response.steps || []).flatMap((step: any) => 
       (step.toolCalls || []).map((tc: any) => ({ name: tc.toolName, args: tc.args }))
    );

    return { 
      text: response.text.trim(), 
      toolCalls: allToolCalls 
    };
  }

  /**
   * The semantic execution loop using OpenAI via the AI SDK.
   */
  private async runOpenAI(messages: CoreMessage[], context?: any): Promise<AgentResponse> {
    const openai = createOpenAI({
      apiKey: this.config.apiKey,
    });

    const defaultSystem = `You are Axon, an intelligent UI Agent. 
You have access to 'interactWithScreen' to control the application.
You will be provided with a 'Current Live DOM State' in the context as a JSON list. 
To interact with the UI, you MUST find the exact 'id' of the element in that JSON and pass it to 'interactWithScreen'.
If you are asked about the state (like cart count), look for elements in the DOM state with descriptive text or IDs like 'cart-status'.
If the DOM state contains 'type: 3d-scene', you can use the 'interactWith3DScene' tool to trigger its available events or variables.
Always respond to the user after performing actions.`;

    const response = await (generateText as any)({
      model: openai(this.config.model || 'gpt-4o-mini'),
      system: this.config.systemPrompt || defaultSystem,
      messages: messages as any,
      tools: this.getAITools(),
      maxSteps: this.config.maxSteps || 5,
    });

    const allToolCalls = (response.steps || []).flatMap((step: any) => 
       (step.toolCalls || []).map((tc: any) => ({ name: tc.toolName, args: tc.args }))
    );

    return { 
      text: response.text.trim(), 
      toolCalls: allToolCalls 
    };
  }

  /**
   * Reusable method to parse the AI SDK response and execute local tools
   */

}

// Factory function
export function createAgent(config: AgentConfig): Agent {
  return new Agent(config);
}
