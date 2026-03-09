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
      emitEvent: (action: string, targetName: string) => app.emitEvent?.(action, targetName),
      setVariable: (name: string, value: any) => app.setVariable?.(name, value)
    };

    console.log('[SynapseJS] 3D Interop Registered');

    return () => {
      console.log('[SynapseJS] 3D Interop Unregistered');
      delete (window as any).SynapseSplineInterop;
    };
  }, [app]);
}
