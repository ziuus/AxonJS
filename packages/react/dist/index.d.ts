import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { Agent, SynapseFeat } from '@synapsenodes/core';
export { Agent, createAgent } from '@synapsenodes/core';

interface SynapseProviderProps {
    runtime: Agent;
    feats?: SynapseFeat[];
    children: ReactNode;
}
declare function SynapseProvider({ runtime, feats, children }: SynapseProviderProps): react_jsx_runtime.JSX.Element;
declare function useAgent(): Agent;

/**
 * Hook to register a 3D application (e.g., Spline) for SynapseJS interoperability.
 * @param app The 3D application instance (e.g., the Spline app object).
 */
declare function useSynapse3D(app: any): void;

interface SynapseAvatarProps {
    modelUrl: string;
    animationState?: string;
    isTyping?: boolean;
    speakText?: string | null;
    scale?: number;
    position?: [number, number, number];
}
declare function SynapseAvatar({ modelUrl, animationState, isTyping, speakText, scale, position, className, showBadge }: SynapseAvatarProps & {
    className?: string;
    showBadge?: boolean;
}): react_jsx_runtime.JSX.Element;

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'aborted' | 'language-not-supported' | 'service-not-allowed' | 'bad-grammar';
    message: string;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}
declare global {
    interface Window {
        SpeechRecognition?: {
            new (): SpeechRecognition;
        };
        webkitSpeechRecognition?: {
            new (): SpeechRecognition;
        };
    }
}
declare function useSynapseSpeech(options?: {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
}): {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    error: string | null;
    isSupported: boolean;
};

type SynapseActionHandler = (args: any) => void | Promise<void>;
/**
 * useSynapseActionRegistry
 *
 * Allows frontend developers to define closures (e.g. router pushes, toast triggers, state changes)
 * that the LLM can execute via the ActionFeat's `executeAction` tool.
 *
 * Returns a signal handler for `EXECUTE_ACTION` that you pass into `useSynapseSignals`.
 *
 * @example
 * const actionHandler = useSynapseActionRegistry({
 *   navigateHome: () => router.push('/'),
 *   changeTheme: ({ theme }) => setTheme(theme),
 * });
 *
 * const { processSignals } = useSynapseSignals({
 *   EXECUTE_ACTION: actionHandler,
 *   // ... other handlers
 * });
 */
declare function useSynapseActionRegistry(actions: Record<string, SynapseActionHandler>): (payload: any) => void;

export { type SynapseActionHandler, SynapseAvatar, SynapseProvider, type SynapseProviderProps, useAgent, useSynapse3D, useSynapseActionRegistry, useSynapseSpeech };
