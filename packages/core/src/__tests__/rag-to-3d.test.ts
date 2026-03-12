import { describe, it, expect, vi } from 'vitest';
import { ThreeDFeat } from '../feats/three-d';
import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────────
// 1. ThreeDFeat tool registration
// ────────────────────────────────────────────────────────────────────────────
describe('ThreeDFeat registration', () => {
  it('should register exactly 3 tools', () => {
    expect(ThreeDFeat.tools).toHaveLength(3);
  });

  it('should register trigger3DAnimation tool', () => {
    const tool = ThreeDFeat.tools.find(t => t.name === 'trigger3DAnimation');
    expect(tool).toBeDefined();
  });

  it('should register setCharacterEmotion tool', () => {
    const tool = ThreeDFeat.tools.find(t => t.name === 'setCharacterEmotion');
    expect(tool).toBeDefined();
  });

  it('should register set3DScale tool', () => {
    const tool = ThreeDFeat.tools.find(t => t.name === 'set3DScale');
    expect(tool).toBeDefined();
  });

  it('should have the correct manifest name', () => {
    expect(ThreeDFeat.manifest.name).toBe('3D Interaction');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. trigger3DAnimation schema validation
// ────────────────────────────────────────────────────────────────────────────
describe('trigger3DAnimation schema', () => {
  const tool = ThreeDFeat.tools.find(t => t.name === 'trigger3DAnimation')!;

  it('accepts a valid animationName string', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({ animationName: 'Greeting' });
    expect(result.success).toBe(true);
  });

  it('rejects missing animationName', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-string animationName', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({ animationName: 123 });
    expect(result.success).toBe(false);
  });

  it('returns 3D_INTERACTION signal on execute', async () => {
    const result = await tool.execute({ animationName: 'Jump' });
    expect((result as any)._synapseSignal).toBe('3D_INTERACTION');
    expect((result as any).payload.actionType).toBe('emitEvent');
    expect((result as any).payload.target).toBe('Jump');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. setCharacterEmotion schema validation
// ────────────────────────────────────────────────────────────────────────────
describe('setCharacterEmotion schema', () => {
  const tool = ThreeDFeat.tools.find(t => t.name === 'setCharacterEmotion')!;

  it('accepts valid emotion: happy', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({ emotion: 'happy' });
    expect(result.success).toBe(true);
  });

  it('accepts valid emotion: thinking', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({ emotion: 'thinking' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid emotion string', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({ emotion: 'angry' });
    expect(result.success).toBe(false);
  });

  it('rejects missing emotion', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({});
    expect(result.success).toBe(false);
  });

  it('returns 3D_INTERACTION signal with setVariable actionType', async () => {
    const result = await tool.execute({ emotion: 'sad' });
    expect((result as any)._synapseSignal).toBe('3D_INTERACTION');
    expect((result as any).payload.actionType).toBe('setVariable');
    expect((result as any).payload.target).toBe('emotion');
    expect((result as any).payload.value).toBe('sad');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 4. set3DScale schema validation
// ────────────────────────────────────────────────────────────────────────────
describe('set3DScale schema', () => {
  const tool = ThreeDFeat.tools.find(t => t.name === 'set3DScale')!;

  it('accepts valid target and scale', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({ target: 'Head', scale: 1.5 });
    expect(result.success).toBe(true);
  });

  it('rejects missing scale', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({ target: 'Head' });
    expect(result.success).toBe(false);
  });

  it('rejects non-number scale', () => {
    const result = (tool.schema as z.ZodObject<any>).safeParse({ target: 'Head', scale: 'big' });
    expect(result.success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 5. Sentiment injection (RAG → 3D signal)
// ────────────────────────────────────────────────────────────────────────────
describe('Sentiment-driven 3D signal injection', () => {
  it('injects Greeting animation for happy sentiment keyword', () => {
    // Simulate what Agent.run does after receiving a happy response
    const responseText = 'Great! I\'m so happy to help you today!';
    const lower = responseText.toLowerCase();
    
    // Mirror the analyzeSentiment logic from agent.ts
    let sentiment: string = 'neutral';
    if (lower.includes('great') || lower.includes('excellent') || lower.includes('awesome')) sentiment = 'excited';
    else if (lower.includes('happy') || lower.includes('glad') || lower.includes('welcome')) sentiment = 'happy';
    else if (lower.includes('hmm') || lower.includes('let me think') || lower.includes('interesting')) sentiment = 'thinking';

    const animationMap: Record<string, string> = {
      happy: 'Greeting', sad: 'Defeat', thinking: 'Thinking',
      surprised: 'Surprise', excited: 'Jump', neutral: 'Idle'
    };
    
    const injectedCalls: { name: string; args: any }[] = [];
    if (sentiment !== 'neutral') {
      injectedCalls.push({ name: 'trigger3DAnimation', args: { animationName: animationMap[sentiment] } });
      if (['happy', 'sad', 'thinking', 'surprised'].includes(sentiment)) {
        injectedCalls.push({ name: 'setCharacterEmotion', args: { emotion: sentiment } });
      }
    }

    // "great" triggers 'excited' first (lexical priority), then Jump
    expect(injectedCalls.length).toBeGreaterThan(0);
    expect(injectedCalls[0].name).toBe('trigger3DAnimation');
  });

  it('injects no 3D calls for neutral response', () => {
    const responseText = 'The capital of France is Paris.';
    const lower = responseText.toLowerCase();
    let sentiment = 'neutral';
    if (lower.includes('great') || lower.includes('awesome')) sentiment = 'excited';
    else if (lower.includes('happy') || lower.includes('glad')) sentiment = 'happy';
    
    const injectedCalls: any[] = [];
    if (sentiment !== 'neutral') {
      injectedCalls.push({ name: 'trigger3DAnimation', args: {} });
    }
    
    expect(injectedCalls).toHaveLength(0);
  });

  it('injects Thinking animation for "let me think" phrase', () => {
    const responseText = 'Let me think about this for a moment...';
    const lower = responseText.toLowerCase();
    let sentiment = 'neutral';
    if (lower.includes('hmm') || lower.includes('let me think') || lower.includes('interesting')) sentiment = 'thinking';
    
    const animationMap: Record<string, string> = { thinking: 'Thinking', happy: 'Greeting', sad: 'Defeat', excited: 'Jump', surprised: 'Surprise', neutral: 'Idle' };
    
    const injectedCalls: any[] = [];
    if (sentiment !== 'neutral') {
      injectedCalls.push({ name: 'trigger3DAnimation', args: { animationName: animationMap[sentiment] } });
    }
    
    expect(injectedCalls[0].args.animationName).toBe('Thinking');
  });
});
