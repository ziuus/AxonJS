import { useState, useCallback, useRef } from 'react';
import { useAgent } from './SynapseProvider';
import { SynapseActionHandler } from './useSynapseAction';

export interface SynapseSignal {
  type: string;
  content: string;
  toolCalls?: any[];
  payload?: any;
}

export interface UseSynapseSignalsOptions {
  onSignal?: (signal: SynapseSignal) => void;
  [key: string]: any; // To allow arbitrary signal type handlers
}

export function useSynapseSignals(options: UseSynapseSignalsOptions = {}) {
  const agent = useAgent();
  const [signals, setSignals] = useState<SynapseSignal[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const processSignals = useCallback(async (toolCalls: any[]) => {
    for (const call of toolCalls) {
      const type = call.name.toUpperCase();
      const handler = optionsRef.current[type];
      
      if (handler) {
        await handler(call.args);
      }
    }
  }, []);

  const runAgent = useCallback(async (input: string) => {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setSignals(prev => [...prev, { type: 'user', content: input }]);

    try {
      const response = await agent.run([{ role: 'user', content: input }]);
      const agentSignal: SynapseSignal = { 
        type: 'response', 
        content: response.text,
        toolCalls: response.toolCalls
      };
      
      setSignals(prev => [...prev, agentSignal]);

      if (response.toolCalls && response.toolCalls.length > 0) {
        await processSignals(response.toolCalls);
      }
      
      if (optionsRef.current.onSignal) {
        optionsRef.current.onSignal(agentSignal);
      }

      return response;
    } catch (error: any) {
      console.error('[SynapseJS] Agent execution failed:', error);
      setSignals(prev => [...prev, { type: 'error', content: error.message || 'Unknown error occurred' }]);
    } finally {
      setIsProcessing(false);
    }
  }, [agent, isProcessing, processSignals]);

  const clearSignals = useCallback(() => setSignals([]), []);

  return {
    signals,
    isProcessing,
    runAgent,
    processSignals,
    clearSignals
  };
}
