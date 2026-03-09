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

export { SynapseProvider, type SynapseProviderProps, useAgent, useSynapse3D };
