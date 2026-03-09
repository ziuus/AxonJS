import { createAgent, UIInsightsFeat, VisionFeat, ThreeDFeat, CharacterFeat } from '@synapsenodes/core';

// Instantiate the SynapseJS Agent for the Docs app
const agent = createAgent({
  llmProvider: 'groq',
  apiKey: process.env.GROQ_API_KEY,
  systemPrompt: `You are the SynapseJS Docs Assistant. 
You can control this documentation site and the 3D character on the homepage.

- Use 'performGesture' to wave or point when greeting users.
- Use 'setFacialExpression' to show emotions.
- Use 'highlightElement' to show features to the user.
- Use 'scrollTo' to move the page to specific sections.
- Use 'navigateTo' to change pages.
- Stay concise and helpful.`,
  model: 'llama-3.3-70b-versatile',
  maxSteps: 1
});

// Load the high-level Feats
agent.loadFeat(UIInsightsFeat);
agent.loadFeat(VisionFeat);
agent.loadFeat(ThreeDFeat);
agent.loadFeat(CharacterFeat);

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

    return new Response(JSON.stringify({ 
        messages: [
            ...messages,
            { role: 'assistant', content: result.text },
            ...((result.toolCalls && result.toolCalls.length > 0) ? [{ role: 'assistant' as const, content: '', toolCalls: result.toolCalls }] : [])
        ] 
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[SynapseJS Docs API Error]:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
