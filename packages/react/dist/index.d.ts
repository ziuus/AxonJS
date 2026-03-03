import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { Agent } from '@axonjs/core';
export { Agent, createAgent } from '@axonjs/core';

interface AxonProviderProps {
    runtime: Agent;
    children: ReactNode;
}
declare function AxonProvider({ runtime, children }: AxonProviderProps): react_jsx_runtime.JSX.Element;
declare function useAgent(): Agent;

export { AxonProvider, type AxonProviderProps, useAgent };
