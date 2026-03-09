import { SynapseFeat } from '../types';
import { z } from 'zod';

/**
 * Standardized feat for controlling 3D human-like characters and avatars.
 * This feat allows the AI to embody a specific character in the scene.
 */
export const CharacterFeat: SynapseFeat = {
  manifest: {
    name: 'Character Persona',
    version: '1.0.0',
    description: 'Enables high-level control over character gestures, expressions, and posture.',
    tags: ['3d', 'character', 'animation', 'persona']
  },
  instructions: `
    You are the physical representation of the 3D character in the scene.
    - Use 'performGesture' to express yourself physically (e.g., 'wave' to greet, 'shrug' when unsure).
    - Use 'setFacialExpression' to reflect your internal state or response mood.
    - If a user asks who you are, you can point at yourself or perform a friendly gesture.
  `,
  tools: [
    {
      name: 'performGesture',
      description: 'Triggers a skeletal animation gesture on the character.',
      schema: z.object({ 
        gesture: z.enum(['wave', 'shrug', 'nod', 'shake_head', 'point_up', 'point_forward', 'bow']).describe('The physical gesture to perform') 
      }) as any,
      execute: async ({ gesture }) => ({
        _synapseSignal: '3D_INTERACTION',
        payload: { actionType: 'emitEvent', target: gesture }
      })
    },
    {
      name: 'setFacialExpression',
      description: 'Updates the character morph targets or blend shapes for expressions.',
      schema: z.object({ 
        expression: z.enum(['neutral', 'happy', 'thinking', 'concerned', 'surprised', 'smiling']).describe('The facial expression to apply') 
      }) as any,
      execute: async ({ expression }) => ({
        _synapseSignal: '3D_INTERACTION',
        payload: { actionType: 'setVariable', target: 'expression', value: expression }
      })
    },
    {
      name: 'setPosture',
      description: 'Changes the base idle posture of the character.',
      schema: z.object({ 
        posture: z.enum(['standing', 'sitting', 'attentive', 'relaxed']).describe('The base posture state') 
      }) as any,
      execute: async ({ posture }) => ({
        _synapseSignal: '3D_INTERACTION',
        payload: { actionType: 'setVariable', target: 'posture', value: posture }
      })
    }
  ]
};
