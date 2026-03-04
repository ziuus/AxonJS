import { useEffect, useRef } from 'react';
import type { Application } from '@splinetool/runtime';

// Define the global window object to include Axon Spline integration
declare global {
  interface Window {
    AxonSplineInterop?: {
      app: Application | null;
      emitEvent: (action: string, targetName: string) => void;
      setVariable: (name: string, value: string | number) => void;
    };
  }
}

// Ensure SSR is disabled to avoid Hydration issues
import dynamic from 'next/dynamic';
const Spline = dynamic(() => import('@splinetool/react-spline/next'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-900 border-b border-slate-800" />
});

export default function SplineScene() {
  const isLoaded = useRef(false);

  function onLoad(app: Application) {
    if (isLoaded.current) return;
    isLoaded.current = true;
    
    // Attach the Spline Application reference to the global Window object
    // so the AxonJS Chat interface can programmatically trigger 3D events
    window.AxonSplineInterop = {
      app,
      emitEvent: (action: string, targetName: string) => {
        try {
          app.emitEvent(action as any, targetName);
          console.log(`[Axon 3D] Emitted '${action}' on '${targetName}'`);
        } catch (e) {
          console.warn(`[Axon 3D] Failed to emit '${action}' on '${targetName}'`, e);
        }
      },
      setVariable: (name: string, value: string | number) => {
        try {
           app.setVariable(name, value as any);
           console.log(`[Axon 3D] Set variable '${name}' to '${value}'`);
        } catch (e) {
           console.warn(`[Axon 3D] Failed to set variable '${name}'`, e);
        }
      }
    };
  }

  // Cleanup the global reference on unmount
  useEffect(() => {
    return () => {
      delete window.AxonSplineInterop;
    };
  }, []);

  return (
    <div 
      className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden bg-slate-900 border-b border-slate-800"
      id="hero-3d-scene"
      /* Make it visible to the AxonJS agent */
      data-axon-3d="true"
      data-3d-events="mouseHover (trigger hover animations), mouseDown (trigger click actions)"
    >
        <Spline 
          scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" 
          onLoad={onLoad}
          className="absolute inset-0 w-full h-full pointer-events-auto"
        />
        
        {/* Overlay Content to make it look like a seamless hero */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10" />
        
        <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-md">
                Spatial Web
            </h2>
            <p className="text-slate-300 max-w-md drop-shadow max-w-sm">
                "Wait, the Agent can see 3D objects too?"<br/>
                Try asking it to trigger an animation.
            </p>
        </div>
    </div>
  );
}
