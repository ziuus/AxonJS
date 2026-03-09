import { SynapseFeat } from '../types';
import { z } from 'zod';

/**
 * Standardized feat for interacting with 3D scenes (Spline, Three.js, etc.)
 */
export const ThreeDFeat: SynapseFeat = {
  manifest: {
    name: '3D Interaction',
    version: '1.0.0',
    description: 'Enables high-level control over 3D characters and interactive scenes.',
    tags: ['3d', 'animation', 'spline']
  },
  instructions: `
    Use 'trigger3DAnimation' to play named animations (e.g., 'wave', 'nod').
    Use 'setCharacterEmotion' to set mood variables (e.g., 'happy', 'thinking').
    Use 'pointAtElement' to look at specific UI elements via data-synapse IDs.
  `,
  tools: [
    {
      name: 'trigger3DAnimation',
      description: 'Triggers a named animation sequence in the 3D scene.',
      schema: z.object({ 
        animationName: z.string().describe('The name of the animation to play') 
      }) as any,
      execute: async ({ animationName }) => ({
        _synapseSignal: '3D_INTERACTION',
        payload: { actionType: 'emitEvent', target: animationName }
      })
    },
    {
      name: 'setCharacterEmotion',
      description: 'Changes character mood or state via 3D scene variables.',
      schema: z.object({ 
        emotion: z.enum(['happy', 'sad', 'thinking', 'surprised']).describe('The mood to set') 
      }) as any,
      execute: async ({ emotion }) => ({
        _synapseSignal: '3D_INTERACTION',
        payload: { actionType: 'setVariable', target: 'emotion', value: emotion }
      })
    }
  ]
};
