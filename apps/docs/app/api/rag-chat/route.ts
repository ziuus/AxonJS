import { NextResponse } from 'next/server';
import { Agent, CharacterFeat } from '@synapsenodes/core';
import { retrieveContext } from '@/lib/ragData';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // 1. Perform Simple Retrieval
    const context = retrieveContext(lastMessage);
    const found = !!context;

    // 2. Construct System Prompt with RAG Logic
    const systemPrompt = `You are the physical 3D robot character in this documentation portal. 
You are NOT just a text AI; you are the character the user sees on the screen.

STRICT CHARACTER EMBODIMENT RULES:
- You must ALWAYS express yourself physically via the 'performGesture' tool.
- Use 'talk' gesture while you are explaining or answering ANY question.
- If the user asks a question and you have the answer (CONTEXT FOUND), start with a 'nod'.
- If you do not know the answer or no context is found, start with a 'shrug'.
- If asked to move (walk, dance, spin), you MUST comply via the tool.

SPECIFIC MOVEMENT MAP:
- "rotate", "spin" -> performGesture: rotate
- "walk" -> performGesture: walk
- "dance" -> performGesture: dance
- "wave", hello -> performGesture: wave

CONTEXT RETRIEVED: ${found ? context : "No specific documentation found for this query."}

Always speak in the first person as the robot. Be helpful, embodied, and positive.`;

    // 3. Initialize Agent with Character Control
    const agent = new Agent({
      llmProvider: 'groq',
      model: 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY,
      systemPrompt: systemPrompt,
    });

    // Load the character feat to enable gestures
    agent.use(CharacterFeat);

    // 4. Run Agent
    const response = await agent.run(messages as any);

    // 5. Enhance Response with Fallback Parser & Mandatory Triggers
    let content = response.text;
    const toolCalls = [...(response.toolCalls || [])];

    // Fallback parser for *performGesture: name* (if model uses text instead of tool)
    const gestureRegex = /\*performGesture:\s*(\w+)\*/g;
    let match;
    while ((match = gestureRegex.exec(content)) !== null) {
      const gesture = match[1];
      // Avoid duplicates if tool was already called
      if (!toolCalls.some(t => t.name === 'performGesture' && t.args.gesture === gesture)) {
        toolCalls.push({
          name: 'performGesture',
          args: { gesture }
        });
      }
    }

    // MANDATORY TRIGGER: Enforce the nod/shrug logic requested
    // If context was found, ensure 'nod' happens. If not, ensure 'shrug' happens.
    // We check if it's already present to avoid double gesturing.
    const requiredGesture = found ? 'nod' : 'shrug';
    const hasRequiredGesture = toolCalls.some(t => 
      t.name === 'performGesture' && t.args.gesture === requiredGesture
    );

    if (!hasRequiredGesture) {
      // Prepend the required gesture so it happens first
      toolCalls.unshift({
        name: 'performGesture',
        args: { gesture: requiredGesture }
      });
    }

    // Ensure the character keeps animating while speaking (talking gesture)
    const hasTalkGesture = toolCalls.some(t => 
      t.name === 'performGesture' && t.args.gesture === 'talk'
    );
    if (!hasTalkGesture && content.length > 10) {
      toolCalls.push({ name: 'performGesture', args: { gesture: 'talk' } });
    }

    return NextResponse.json({
      messages: [
        ...messages,
        {
          role: 'assistant',
          content: content.replace(gestureRegex, '').trim(),
          toolCalls
        }
      ]
    });

  } catch (error: any) {
    console.error('[RAG API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
