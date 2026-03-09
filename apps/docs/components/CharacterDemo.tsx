'use client';

import React, { useState, useEffect } from 'react';
import { useSynapse3D } from '@synapsenodes/react';
import Spline from '@splinetool/react-spline';

export function CharacterDemo() {
  const [splineApp, setSplineApp] = useState<any>(null);
  
  // Register the Spline app to Synapse interop
  useSynapse3D(splineApp);

  function onLoad(spline: any) {
    setSplineApp(spline);
    console.log('[Demo] Spline Loaded');
  }

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md">
      <div className="absolute top-4 left-4 z-10 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-white/70">
        3D PERSONA RUNTIME
      </div>
      
      {/* 
        NOTE: In a real app, the user would provide their Spline scene URL.
        This component acts as a bridge for the Synapse Agent.
      */}
      <Spline 
        scene="https://prod.spline.design/6Wq1Q7YGyH-i-0kw/scene.splinecode" 
        onLoad={onLoad}
      />

      {!splineApp && (
        <div className="absolute inset-0 flex items-center justify-center text-white/20 animate-pulse">
          Initializing Character Rig...
        </div>
      )}
    </div>
  );
}
