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
 * ActionFeat - Agentic Co-Browsing (v2 - Multi-Step Orchestration)
 * 
 * Exposes three tools to the LLM:
 * 1. `executeAction` - Execute a single registered frontend action.
 * 2. `reportActionStatus` - Emit an intermediate status update/progress message to the UI.
 * 3. `executeActionSequence` - Chain multiple actions in a defined sequence, with progress reporting.
 */
export function ActionFeat(config: ActionFeatConfig): SynapseFeat {
  
  const actionEnums = config.actions.map(a => a.id);
  
  // Tool 1: Single action executor (unchanged)
  const executeActionTool: Tool = {
    name: 'executeAction',
    description: 'Execute a single pre-registered frontend action by its ID.',
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

  // Tool 2: Status reporter - lets agent stream incremental progress to the UI
  const reportActionStatusTool: Tool = {
    name: 'reportActionStatus',
    description: 'Report an intermediate progress status to the user\'s UI during a multi-step task. Use this to keep the user informed (e.g., "Scanning for submit button...", "Filling form fields...").',
    schema: z.object({
      message: z.string().describe('A short, human-readable status message describing what the agent is currently doing.'),
      step: z.number().optional().describe('Optional current step number (1-indexed) for multi-step tasks.'),
      totalSteps: z.number().optional().describe('Optional total number of steps in the task.'),
    }) as any,
    execute: async ({ message, step, totalSteps }: any) => {
      return {
        _synapseSignal: 'ACTION_STATUS_UPDATE',
        payload: { message, step, totalSteps }
      };
    }
  };

  // Tool 3: Sequence executor - chain multiple actions in order
  const executeActionSequenceTool: Tool = {
    name: 'executeActionSequence',
    description: 'Execute a sequence of pre-registered frontend actions in order. Use this for multi-step tasks where you need to perform several actions (e.g., navigate then fill form then submit). Each step is executed in order.',
    schema: z.object({
      steps: z.array(z.object({
        actionId: z.enum(actionEnums as [string, ...string[]]).describe('The ID of the action to execute in this step.'),
        args: z.record(z.any()).optional().describe('Arguments for this step.'),
        statusMessage: z.string().optional().describe('A status message to display to the user before executing this step.'),
      })).describe('An ordered array of action steps to execute in sequence.'),
      description: z.string().optional().describe('A human-readable summary of what this sequence accomplishes.'),
    }) as any,
    execute: async ({ steps, description }: any) => {
      return {
        _synapseSignal: 'EXECUTE_ACTION_SEQUENCE',
        payload: { steps, description }
      };
    }
  };

  const actionDescriptions = config.actions.map(a => 
    `- **${a.id}**: ${a.description}`
  ).join('\n');

  return {
    manifest: {
      name: 'ActionFeat',
      version: '2.0.0',
      description: 'Agentic Co-browsing with multi-step orchestration support'
    },
    tools: [executeActionTool, reportActionStatusTool, executeActionSequenceTool],
    instructions: `You have access to the following custom frontend actions:\n${actionDescriptions}\n\nTools available:\n- **executeAction**: Run a single action immediately.\n- **reportActionStatus**: Emit a progress message to the UI (use this between steps of complex tasks).\n- **executeActionSequence**: Chain multiple actions in sequence for multi-step tasks.\n\nFor complex tasks (e.g., "fill out and submit the login form"), prefer using executeActionSequence with descriptive statusMessage fields for each step, so the user sees progress.`
  };
}
