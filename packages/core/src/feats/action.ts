import { SynapseFeat, Tool } from '../types';
import { z } from 'zod';

export interface ActionDefinition {
  id: string;
  description: string;
  schema?: z.ZodTypeAny;
}

export interface ActionFeatConfig {
  /**
   * List of actions exposed to the LLM.
   * The actual execution logic is handled by the React client.
   */
  actions: ActionDefinition[];
}

/**
 * ActionFeat - Agentic Co-Browsing
 * Exposes a generic `executeAction` tool to the LLM. 
 * The LLM can call this tool with a specific `actionId` and arguments,
 * which emits an EXECUTE_ACTION signal for the frontend to handle.
 */
export function ActionFeat(config: ActionFeatConfig): SynapseFeat {
  
  const actionEnums = config.actions.map(a => a.id);
  
  const executeActionTool: Tool = {
    name: 'executeAction',
    description: 'Execute a pre-registered frontend action by ID. Look at the system instructions for available actions and their required arguments.',
    schema: z.object({
      actionId: z.enum(actionEnums as [string, ...string[]]).describe('The ID of the action to execute'),
      args: z.record(z.any()).optional().describe('JSON object containing the arguments for the action'),
    }) as any,
    execute: async ({ actionId, args }: any) => {
      return {
        _synapseSignal: 'EXECUTE_ACTION',
        payload: { actionId, args }
      };
    }
  };

  const actionDescriptions = config.actions.map(a => 
    `- **${a.id}**: ${a.description}`
  ).join('\n');

  return {
    manifest: {
      name: 'ActionFeat',
      version: '1.0.0',
      description: 'Agentic Co-browsing tool registry for custom frontend functions'
    },
    tools: [executeActionTool],
    instructions: `You have access to the following custom frontend actions via the 'executeAction' tool:\n${actionDescriptions}\nTo trigger one of these, use executeAction({ actionId: "...", args: {...} }).`
  };
}
