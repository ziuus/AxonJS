"use client";

import { useRef, useEffect } from 'react';

export type SynapseActionHandler = (args: any) => void | Promise<void>;

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
export function useSynapseActionRegistry(actions: Record<string, SynapseActionHandler>) {
  const actionsRef = useRef(actions);
  
  useEffect(() => {
    actionsRef.current = actions;
  });

  return (payload: any) => {
    const { actionId, args } = payload || {};
    const handler = actionsRef.current[actionId];
    if (handler) {
      try {
        handler(args || {});
      } catch (e) {
        console.error(`[SynapseJS ActionRegistry] Handler for action '${actionId}' threw an error:`, e);
      }
    } else {
      console.warn(`[SynapseJS ActionRegistry] No frontend handler registered for action '${actionId}'.`);
    }
  };
}
