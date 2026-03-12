export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const knowledgeBase: KnowledgeItem[] = [
  {
    id: 'synapse-core',
    question: 'What is SynapseJS?',
    answer: 'SynapseJS is a lightweight, cross-engine framework for building AI-powered 3D experiences. It bridges large language models with 3D engines like Three.js and Spline using a signal-based protocol.',
    keywords: ['synapsejs', 'what is', 'framework', 'intro', 'core']
  },
  {
    id: 'synapse-feats',
    question: 'What are Feats?',
    answer: 'Feats are modular capability bundles in SynapseJS. They package specific tools and behaviors (like "CharacterFeat" for animation or "VisionFeat" for seeing the screen) that can be dynamically loaded into an agent.',
    keywords: ['feat', 'feats', 'capability', 'bundle', 'tools']
  },
  {
    id: 'synapse-animation',
    question: 'How does animation work?',
    answer: 'SynapseJS uses the CharacterFeat to handle animations. It maps AI intentions to 3D gestures using the *performGesture: name* syntax, supporting blending, crossfading, and emote triggers.',
    keywords: ['animation', 'move', 'gesture', 'character', 'emote']
  },
  {
    id: 'synapse-rag',
    question: 'Does it support RAG?',
    answer: 'Yes. This very chat is running on a RAG pipeline! SynapseJS agents can ingest retrieved context dynamically to inform their responses and actions.',
    keywords: ['rag', 'retrieval', 'context', 'knowledge']
  },
  {
    id: 'synapse-engines',
    question: 'Supported Engines',
    answer: 'SynapseJS is engine-agnostic but has first-class support for Three.js (via React Three Fiber) and Spline. It uses a unified event bus to talk to any 3D scene.',
    keywords: ['engine', 'three.js', 'spline', 'support', 'r3f']
  }
];

export function retrieveContext(query: string): string | null {
  if (!query) return null;
  const normalizedQuery = query.toLowerCase();
  
  // Simple keyword matching for the mock
  const match = knowledgeBase.find(item => 
    item.keywords.some(kw => normalizedQuery.includes(kw)) ||
    item.question.toLowerCase().includes(normalizedQuery)
  );
  
  return match ? match.answer : null;
}
