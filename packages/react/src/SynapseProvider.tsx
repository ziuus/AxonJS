import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Agent, SynapseFeat } from '@synapsenodes/core';

export interface SynapseTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    surface: string;
    text: string;
    background: string;
  };
  typography: {
    fontMain: string;
    fontMono: string;
  };
  effects: {
    glassmorphism: number; // 0 to 1 opacity for backdrop-blur
    glow: number;          // glow intensity multiplier
  };
}

export const SYNAPSE_THEMES = {
  AURORA: {
    colors: {
      primary: '#6366f1',
      secondary: '#a855f7',
      accent: '#38bdf8',
      surface: 'rgba(255, 255, 255, 0.05)',
      text: '#f8fafc',
      background: '#020617',
    },
    typography: {
      fontMain: "'Inter', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
    effects: {
      glassmorphism: 0.6,
      glow: 1.0,
    }
  } as SynapseTheme,
  MIDNIGHT: {
    colors: {
      primary: '#f43f5e',
      secondary: '#fb923c',
      accent: '#facc15',
      surface: 'rgba(0, 0, 0, 0.2)',
      text: '#ffffff',
      background: '#000000',
    },
    typography: {
      fontMain: "'Space Grotesk', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
    effects: {
      glassmorphism: 0.8,
      glow: 1.5,
    }
  } as SynapseTheme
};

interface SynapseContextType {
  agent: Agent;
  theme: SynapseTheme;
  themeMode: 'dark' | 'light';
}

const SynapseContext = createContext<SynapseContextType | null>(null);

export interface SynapseProviderProps {
  runtime: Agent;
  feats?: SynapseFeat[];
  theme?: SynapseTheme;
  themeMode?: 'dark' | 'light';
  children: ReactNode;
}

export function SynapseProvider({ 
  runtime, 
  feats, 
  theme = SYNAPSE_THEMES.AURORA, 
  themeMode = 'dark', 
  children 
}: SynapseProviderProps) {
  // Load feats on initialization
  useEffect(() => {
    if (feats) {
      feats.forEach(feat => runtime.loadFeat(feat));
    }
  }, [runtime, feats]);

  // Inject Theme Variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Set theme variables
    Object.entries(theme.colors).forEach(([key, val]) => {
      root.style.setProperty(`--synapse-${key}`, val);
    });
    
    root.style.setProperty('--synapse-font-main', theme.typography.fontMain);
    root.style.setProperty('--synapse-font-mono', theme.typography.fontMono);
    root.style.setProperty('--synapse-glass', theme.effects.glassmorphism.toString());
    root.style.setProperty('--synapse-glow', theme.effects.glow.toString());
    
    // Set theme mode class
    root.classList.remove('synapse-dark', 'synapse-light');
    root.classList.add(`synapse-${themeMode}`);
    
  }, [theme, themeMode]);

  return (
    <SynapseContext.Provider value={{ agent: runtime, theme, themeMode }}>
      {children}
    </SynapseContext.Provider>
  );
}

export function useAgent(): Agent {
  const context = useContext(SynapseContext);
  if (!context) {
    throw new Error('useAgent must be used within an SynapseProvider');
  }
  return context.agent;
}

export function useTheme() {
  const context = useContext(SynapseContext);
  if (!context) {
    throw new Error('useTheme must be used within an SynapseProvider');
  }
  return { theme: context.theme, themeMode: context.themeMode };
}
