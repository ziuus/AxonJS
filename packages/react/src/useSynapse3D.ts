import { useEffect } from 'react';

/**
 * Hook to register a 3D application (e.g., Spline) for SynapseJS interoperability.
 * @param app The 3D application instance (e.g., the Spline app object).
 */
export function useSynapse3D(app: any) {
  useEffect(() => {
    if (!app || typeof window === 'undefined') return;

    // Register to global interop for signal processing
    (window as any).SynapseSplineInterop = {
      app,
      emitEvent: (action: string, targetName?: string) => {
        // Support both global events and object-specific events
        if (targetName) {
          app.emitEvent?.(action, targetName);
        } else {
          app.emitEvent?.(action);
        }
      },
      setVariable: (name: string, value: any) => {
        // Some rigs use nested variables like "character.expression"
        app.setVariable?.(name, value);
      }
    };

    console.log('[SynapseJS] 3D Interop Registered');

    return () => {
      console.log('[SynapseJS] 3D Interop Unregistered');
      delete (window as any).SynapseSplineInterop;
    };
  }, [app]);
}
