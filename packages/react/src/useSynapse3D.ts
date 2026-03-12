import { useEffect } from 'react';

/**
 * Hook to register a 3D application (e.g., Spline) for SynapseJS interoperability.
 * @param app The 3D application instance (e.g., the Spline app object).
 */
export function useSynapse3D(app: any) {
  useEffect(() => {
    if (!app || typeof window === 'undefined') return;

    // Detect engine and register bridge
    const bridge = {
      app,
      setVariable: (name: string, value: any) => {
        if (app.setVariable) {
          // Spline engine
          app.setVariable(name, value);
        } else if (app.isObject3D || app.isScene || app.getObjectByName) {
          // Standard Three.js (Root object or Scene)
          const object = app.getObjectByName ? app.getObjectByName(name) : null;
          if (object) {
            // Apply property updates safely
            if (typeof value === 'object' && value !== null) {
              Object.entries(value).forEach(([key, val]) => {
                const target = (object as any)[key];
                // Handle Three.js types (Vector3, Euler, Color, etc.)
                if (target && typeof target.copy === 'function' && typeof val === 'object' && val !== null) {
                  target.copy(val);
                } else if (target && typeof target.set === 'function') {
                  if (Array.isArray(val)) {
                    target.set(...val);
                  } else {
                    target.set(val);
                  }
                } else {
                  (object as any)[key] = val;
                }
              });
            } else {
              object.userData.synapseValue = value;
            }
          }
        }
      },
      emitEvent: (type: string, name?: string) => {
        if (app.emitEvent) {
          // Spline events
          if (name) {
            app.emitEvent(type, name);
          } else {
            app.emitEvent(type);
          }
        }
      },
    };

    // Register to global interop for signal processing
    (window as any).Synapse3D = bridge;
    // Fallback for legacy (if any)
    (window as any).SynapseSplineInterop = bridge;

    console.log('[SynapseJS] 3D Interop Registered (Multi-Engine)');

    return () => {
      console.log('[SynapseJS] 3D Interop Unregistered');
      delete (window as any).Synapse3D;
      delete (window as any).SynapseSplineInterop;
    };
  }, [app]);
}
