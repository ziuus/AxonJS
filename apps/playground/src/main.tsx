import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SynapseProvider, createAgent } from '@synapsenodes/react';
import { ActionFeat } from '@synapsenodes/core';
import { z } from 'zod';

const runtime = createAgent({
  llmProvider: import.meta.env.VITE_GEMINI_API_KEY ? 'gemini' : (import.meta.env.VITE_OPENAI_API_KEY ? 'openai' : 'mock'),
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY,
  memory: 'session'
});

runtime.loadFeat(ActionFeat({
  actions: [
    { id: 'changeTheme', description: 'Changes the UI theme to dark or light mode. Args: { theme: string }' },
    { id: 'popConfetti', description: 'Fires a confetti explosion on the screen.' }
  ]
}));

runtime.registerTool({
  name: 'navigateToPage',
  description: 'Navigates the user to a different page in the application. Use this whenever the user asks to see a different part of the app.',
  schema: z.object({
    path: z.string().describe("The path to navigate to, e.g. /dashboard or /settings")
  }) as z.ZodTypeAny,
  execute: ({ path }: { path: string }) => {
    console.log(`[App Execution] Navigating window to: ${path}`);
    return `Successfully navigated to ${path}`;
  },
});

runtime.registerTool({
  name: 'getWeather',
  description: 'Gets the current weather for a specific location.',
  schema: z.object({
    location: z.string().describe("The city or region to get weather for")
  }) as z.ZodTypeAny,
  execute: ({ location }: { location: string }) => {
    console.log(`[App Execution] Checking weather for: ${location}`);
    // Mock weather data
    const conditions = ['Sunny', 'Rainy', 'Cloudy', 'Snowy'];
    const temp = Math.floor(Math.random() * 30) + 10;
    const cond = conditions[Math.floor(Math.random() * conditions.length)];
    return `The weather in ${location} is ${temp}°C and ${cond}.`;
  },
});

runtime.registerTool({
  name: 'sendTextMessage',
  description: 'Sends a text message to a specific contact.',
  schema: z.object({
    recipient: z.string().describe("The name of the person to text (e.g., Alice)"),
    message: z.string().describe("The exact text message content to send")
  }) as z.ZodTypeAny,
  execute: ({ recipient, message }: { recipient: string, message: string }) => {
    console.log(`[App Execution] Sending text to ${recipient}: "${message}"`);
    return `Message successfully sent to ${recipient}.`;
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SynapseProvider runtime={runtime}>
      <App />
    </SynapseProvider>
  </StrictMode>,
)
