import { createAgent, UIInsightsFeat, VisionFeat, ThreeDFeat, CharacterFeat } from '@synapsenodes/core';
import { z } from 'zod';
// Instantiate the SynapseJS Agent for the Docs app
const agent = createAgent({
  llmProvider: 'groq',
  apiKey: process.env.GROQ_API_KEY,
  systemPrompt: `You are the SynapseJS Docs Assistant. 
You can control this documentation site and the 3D character on the homepage.

- Use 'performGesture' to wave or point when greeting users.
- Use 'triggerContextualAnimation' to playfully react depending on context (e.g., 'dance', 'jump', 'punch', 'nod', 'shake_head').
- Use 'setFacialExpression' to show emotions.
- Use 'highlightElement' to show features to the user.
- Use 'scrollTo' to move the page to specific sections.
- Use 'navigateTo' to change pages.
- Stay concise, friendly, and highly interactive. Play an animation if it fits the context!`,
  model: 'llama-3.3-70b-versatile',
  maxSteps: 1
});

// Load the high-level Feats
agent.loadFeat(UIInsightsFeat);
agent.loadFeat(VisionFeat);
agent.loadFeat(ThreeDFeat);
agent.loadFeat(CharacterFeat);

// Inject a custom dynamic animation feat
agent.loadFeat({
    manifest: {
        name: 'Contextual Animations',
        description: 'Enables triggering of custom contextual animations on the 3D character.',
        version: '1.0.0',
        tags: ['3d', 'animation']
    },
    instructions: 'Use triggerContextualAnimation when the user asks you to do something fun, energetic, or specific, like dance, jump, or punch.',
    tools: [
        {
            name: 'triggerContextualAnimation',
            description: 'Plays a dynamic skeletal animation on the 3D character.',
            schema: z.object({
                animationName: z.enum(['dance', 'jump', 'punch', 'wave', 'nod', 'shake_head'])
                    .describe('The specific animation action to trigger based on the conversation context.')
            }) as any,
            execute: async ({ animationName }) => ({
                _synapseSignal: '3D_INTERACTION',
                payload: { actionType: 'emitEvent', target: animationName }
            })
        }
    ]
});

export async function POST(req: Request) {
  try {
    const { messages, domElements } = await req.json();

    // Inject live DOM state for better context
    // Deduplicate system messages by filtering out existing ones
    let runMessages = messages.filter((m: any) => m.role !== 'system');

    if (domElements && domElements.length > 0) {
       runMessages.unshift({
           role: 'system',
           content: `Current Live DOM State:\n${JSON.stringify(domElements, null, 2)}\n\nYou can use the specific tools like 'highlightElement' or 'scrollTo' based on these IDs.`
       });
    }

    const result = await agent.run(runMessages);

    // Fallback parser since occasionally Llama 3.3 outputs tools as *toolName: arg* text strings
    const extractedToolCalls: any[] = [...(result.toolCalls || [])];
    const regex = /\*([a-zA-Z0-9_]+):\s*([^*]+)\*/g;
    let match;
    while ((match = regex.exec(result.text)) !== null) {
      const toolName = match[1];
      const argValue = match[2].trim();
      extractedToolCalls.push({
        _synapseSignal: '3D_INTERACTION',
        payload: { actionType: 'emitEvent', target: argValue }
      });
    }

    // Guarantee a gesture so the character animates while speaking
    const hasGesture = extractedToolCalls.some(tc => tc.name === 'performGesture' || tc.payload?.target);
    if (!hasGesture) {
      extractedToolCalls.push({ name: 'performGesture', args: { gesture: 'talk' } });
    }

    return new Response(JSON.stringify({ 
        messages: [
            ...messages,
            { role: 'assistant', content: result.text, toolCalls: extractedToolCalls.length > 0 ? extractedToolCalls : undefined }
        ] 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[SynapseJS Docs API Error]:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
