// src/AxonProvider.tsx
import { createContext, useContext } from "react";
import { jsx } from "react/jsx-runtime";
var AxonContext = createContext(null);
function AxonProvider({ runtime, children }) {
  return /* @__PURE__ */ jsx(AxonContext.Provider, { value: { agent: runtime }, children });
}
function useAgent() {
  const context = useContext(AxonContext);
  if (!context) {
    throw new Error("useAgent must be used within an AxonProvider");
  }
  return context.agent;
}

// src/index.ts
import { createAgent, Agent } from "@axonjs/core";
export {
  Agent,
  AxonProvider,
  createAgent,
  useAgent
};
