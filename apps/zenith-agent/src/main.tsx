import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SynapseProvider, createAgent } from '@synapsenodes/react';
import { ActionFeat } from '@synapsenodes/core';
import { z } from 'zod';

const runtime = createAgent({
  llmProvider: 'groq',
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  memory: 'session'
});

// Register Zenith-specific tools
runtime.registerTool({
  name: 'viewProperty',
  description: 'Displays detailed information about a specific property listing.',
  schema: z.object({
    id: z.string().describe("The unique ID of the property listing"),
    focus: z.enum(['gallery', 'specs', 'map']).optional().describe("What to focus on specifically")
  }) as z.ZodTypeAny,
  execute: async ({ id, focus }) => {
    console.log(`[Zenith] Focusing on property ${id} with focus: ${focus}`);
    return `Now viewing property ${id} focusing on ${focus || 'overview'}.`;
  },
});

runtime.registerTool({
  name: 'schedulePrivateTour',
  description: 'Initiates the booking flow for a private in-person or virtual tour.',
  schema: z.object({
    propertyId: z.string(),
    type: z.enum(['physical', 'virtual']),
    preferredTime: z.string().describe("Human readable time preference, e.g. tomorrow afternoon")
  }) as z.ZodTypeAny,
  execute: async ({ propertyId, type, preferredTime }) => {
    return `Started booking flow for a ${type} tour of property ${propertyId} at ${preferredTime}. One of our agents will confirm shortly.`;
  },
});

runtime.loadFeat(ActionFeat({
    actions: [
        { id: 'highlightFeature', description: 'Highlights a specific architectural feature of the currently viewed property.' },
        { id: 'toggleAtmosphere', description: 'Changes the lighting/mood of the property visualization.' }
    ]
}));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SynapseProvider runtime={runtime}>
      <App />
    </SynapseProvider>
  </StrictMode>,
)
