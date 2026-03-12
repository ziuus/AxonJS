"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Agent: () => import_core.Agent,
  SynapseAvatar: () => SynapseAvatar,
  SynapseProvider: () => SynapseProvider,
  createAgent: () => import_core.createAgent,
  useAgent: () => useAgent,
  useSynapse3D: () => useSynapse3D,
  useSynapseActionRegistry: () => useSynapseActionRegistry,
  useSynapseSpeech: () => useSynapseSpeech
});
module.exports = __toCommonJS(index_exports);

// src/SynapseProvider.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var SynapseContext = (0, import_react.createContext)(null);
function SynapseProvider({ runtime, feats, children }) {
  (0, import_react.useEffect)(() => {
    if (feats) {
      feats.forEach((feat) => runtime.loadFeat(feat));
    }
  }, [runtime, feats]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SynapseContext.Provider, { value: { agent: runtime }, children });
}
function useAgent() {
  const context = (0, import_react.useContext)(SynapseContext);
  if (!context) {
    throw new Error("useAgent must be used within an SynapseProvider");
  }
  return context.agent;
}

// src/useSynapse3D.ts
var import_react2 = require("react");
function useSynapse3D(app) {
  (0, import_react2.useEffect)(() => {
    if (!app || typeof window === "undefined") return;
    const bridge = {
      app,
      setVariable: (name, value) => {
        if (app.setVariable) {
          app.setVariable(name, value);
        } else if (app.isObject3D || app.isScene || app.getObjectByName) {
          const object = app.getObjectByName(name);
          if (object) {
            if (typeof value === "object" && value !== null) {
              Object.assign(object, value);
            } else {
              object.userData.synapseValue = value;
            }
          }
        }
      },
      emitEvent: (type, name) => {
        if (app.emitEvent) {
          if (name) {
            app.emitEvent(type, name);
          } else {
            app.emitEvent(type);
          }
        }
      }
    };
    window.Synapse3D = bridge;
    window.SynapseSplineInterop = bridge;
    console.log("[SynapseJS] 3D Interop Registered (Multi-Engine)");
    return () => {
      console.log("[SynapseJS] 3D Interop Unregistered");
      delete window.Synapse3D;
      delete window.SynapseSplineInterop;
    };
  }, [app]);
}

// src/SynapseAvatar.tsx
var import_react3 = require("react");
var import_fiber = require("@react-three/fiber");
var import_drei = require("@react-three/drei");
var THREE = __toESM(require("three"));
var import_jsx_runtime2 = require("react/jsx-runtime");
function AvatarModel({ modelUrl, animationState = "idle", isTyping = false, speakText, scale = 0.7, position = [0, -1.8, 0] }) {
  const { scene, animations } = (0, import_drei.useGLTF)(modelUrl);
  const avatarRef = (0, import_react3.useRef)(null);
  const mixer = (0, import_react3.useRef)(null);
  const currentAction = (0, import_react3.useRef)(null);
  const idleAction = (0, import_react3.useRef)(null);
  const [isSpeaking, setIsSpeaking] = (0, import_react3.useState)(false);
  useSynapse3D(scene);
  (0, import_react3.useEffect)(() => {
    if (scene && animations.length) {
      mixer.current = new THREE.AnimationMixer(scene);
      const idle = mixer.current.clipAction(animations.find((a) => a.name === "Idle") || animations[0]);
      idle.play();
      currentAction.current = idle;
      idleAction.current = idle;
      const onFinished = (e) => {
        if (e.action !== idleAction.current && idleAction.current) {
          idleAction.current.reset().fadeIn(0.5).play();
          currentAction.current = idleAction.current;
        }
      };
      mixer.current.addEventListener("finished", onFinished);
      return () => {
        mixer.current?.removeEventListener("finished", onFinished);
      };
    }
  }, [scene, animations]);
  const [isRotating, setIsRotating] = (0, import_react3.useState)(false);
  const rotationProgress = (0, import_react3.useRef)(0);
  const pulseTimer = (0, import_react3.useRef)(null);
  (0, import_fiber.useFrame)((state, delta) => {
    if (mixer.current) mixer.current.update(delta);
    if (isRotating && avatarRef.current) {
      rotationProgress.current += delta * 4;
      avatarRef.current.rotation.y += delta * 4;
      if (rotationProgress.current >= Math.PI * 2) {
        avatarRef.current.rotation.y = 0;
        rotationProgress.current = 0;
        setIsRotating(false);
      }
    }
    if (isSpeaking && avatarRef.current) {
      const head = scene.getObjectByName("Head") || scene.getObjectByName("mixamorig_Head") || scene.getObjectByName("Neck");
      if (head) {
        head.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.05;
      }
    }
    if (scene) {
      const synapseData = scene.userData.synapseValue;
      if (synapseData) {
        const payload = synapseData?.payload || synapseData;
        const isLookAt = payload?.target === "user" || payload?.target === "lookAtTarget" || payload?.target?.target === "user";
        if (isLookAt) {
          const head = scene.getObjectByName("Head") || scene.getObjectByName("mixamorig_Head") || scene.getObjectByName("Neck");
          if (head) {
            head.lookAt(state.camera.position);
          }
        }
      }
    }
  });
  const playAnimation = (targetAnimName) => {
    if (!mixer.current || !animations.length) return;
    const normalizedTargetAnimName = String(targetAnimName).toLowerCase().replace(/[^a-z]/g, "");
    if (normalizedTargetAnimName === "rotate" || normalizedTargetAnimName === "spin" || normalizedTargetAnimName === "turnaround") {
      setIsRotating(true);
      rotationProgress.current = 0;
      return;
    }
    const mapping = {
      wave: "Wave",
      jump: "Jump",
      dance: "Dance",
      nod: "Yes",
      yes: "Yes",
      agree: "Yes",
      shakehead: "No",
      no: "No",
      disagree: "No",
      punch: "Punch",
      idle: "Idle",
      walk: "Walking",
      walking: "Walking",
      talk: "Idle",
      talking: "Idle",
      searching: "Standing",
      thinking: "Idle",
      success: "Yes",
      failure: "No"
    };
    const mappedName = mapping[normalizedTargetAnimName] || targetAnimName;
    const actionAnim = animations.find(
      (a) => a.name.toLowerCase() === mappedName.toLowerCase() || a.name.toLowerCase() === normalizedTargetAnimName
    );
    if (actionAnim) {
      const nextAction = mixer.current.clipAction(actionAnim);
      if (currentAction.current && currentAction.current !== nextAction) {
        const isTalkGesture = normalizedTargetAnimName.startsWith("talk");
        if (actionAnim.name === "Talking") {
          nextAction.setLoop(THREE.LoopRepeat, Infinity);
        } else if (actionAnim.name !== "Idle" && actionAnim.name !== "Dance") {
          nextAction.setLoop(THREE.LoopOnce, 1);
          nextAction.clampWhenFinished = true;
        } else if (actionAnim.name === "Dance") {
          nextAction.setLoop(THREE.LoopRepeat, 3);
          nextAction.clampWhenFinished = true;
        }
        currentAction.current.fadeOut(0.2);
        nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.2).play();
        currentAction.current = nextAction;
      }
    }
  };
  (0, import_react3.useEffect)(() => {
    if (animationState) {
      playAnimation(animationState);
    }
  }, [animationState, animations]);
  (0, import_react3.useEffect)(() => {
    if (speakText && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(speakText);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((v) => v.name.includes("Google") || v.name.includes("Samantha") || v.lang === "en-US");
      if (preferredVoice) msg.voice = preferredVoice;
      msg.pitch = 1.1;
      msg.rate = 1.05;
      msg.onstart = () => {
        setIsSpeaking(true);
        playAnimation("talk");
      };
      msg.onend = () => {
        setIsSpeaking(false);
        if (!isTyping) playAnimation("idle");
      };
      msg.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(msg);
    }
  }, [speakText]);
  (0, import_react3.useEffect)(() => {
    if (isTyping || isSpeaking) {
      if (!pulseTimer.current) {
        pulseTimer.current = setInterval(() => {
          const gestures = ["idle", "idle", "idle", "idle", "nod", "shakehead"];
          const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
          playAnimation(randomGesture);
        }, 2500);
      }
    } else {
      if (pulseTimer.current) {
        clearInterval(pulseTimer.current);
        pulseTimer.current = null;
      }
      if (animationState !== "success" && animationState !== "failure" && !speakText) {
        playAnimation("idle");
      }
    }
    return () => {
      if (pulseTimer.current) {
        clearInterval(pulseTimer.current);
        pulseTimer.current = null;
      }
    };
  }, [isTyping, isSpeaking, animations, animationState, speakText]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("primitive", { ref: avatarRef, object: scene, scale, position });
}
function SynapseAvatar({
  modelUrl,
  animationState,
  isTyping,
  speakText,
  className = "relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md",
  showBadge = true
}) {
  const [pulse, setPulse] = (0, import_react3.useState)(false);
  const lightRef = (0, import_react3.useRef)(null);
  (0, import_react3.useEffect)(() => {
    setPulse(animationState === "searching" || animationState === "thinking");
  }, [animationState]);
  const SceneLights = () => {
    (0, import_fiber.useFrame)(({ clock }) => {
      if (lightRef.current && pulse) {
        lightRef.current.intensity = 1 + Math.sin(clock.elapsedTime * 15) * 0.8;
      } else if (lightRef.current) {
        lightRef.current.intensity = 1;
      }
    });
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ambientLight", { intensity: 0.4 }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("spotLight", { position: [10, 10, 10], angle: 0.15, penumbra: 1, intensity: 1 }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pointLight", { ref: lightRef, position: [2, 2, 2], color: "#6366f1", intensity: 1 })
    ] });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className, children: [
    showBadge && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "absolute top-4 left-4 z-10 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-white/70", children: "GLTF RUNTIME (SYNAPSE AVATAR)" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_fiber.Canvas, { camera: { position: [0, 0, 6], fov: 45 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SceneLights, {}),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_react3.Suspense, { fallback: null, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(AvatarModel, { modelUrl, animationState, isTyping, speakText }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_drei.Environment, { preset: "city" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_drei.ContactShadows, { opacity: 0.4, scale: 10, blur: 1, far: 10, resolution: 256, color: "#000000" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        import_drei.OrbitControls,
        {
          enablePan: false,
          enableZoom: false,
          minPolarAngle: Math.PI / 4,
          maxPolarAngle: Math.PI / 1.5,
          target: [0, -0.5, 0]
        }
      )
    ] })
  ] });
}

// src/useSynapseSpeech.ts
var import_react4 = require("react");
function useSynapseSpeech(options) {
  const [isListening, setIsListening] = (0, import_react4.useState)(false);
  const [transcript, setTranscript] = (0, import_react4.useState)("");
  const [interimTranscript, setInterimTranscript] = (0, import_react4.useState)("");
  const [error, setError] = (0, import_react4.useState)(null);
  const [isSupported, setIsSupported] = (0, import_react4.useState)(false);
  const recognitionRef = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Speech Recognition API is not supported in this browser.");
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = options?.continuous ?? true;
    recognition.interimResults = options?.interimResults ?? true;
    recognition.lang = options?.lang || "en-US";
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    recognition.onresult = (event) => {
      let finalStr = "";
      let interimStr = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interimStr);
      if (finalStr) {
        setTranscript((prev) => prev ? `${prev} ${finalStr}`.trim() : finalStr.trim());
      }
    };
    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error, event.message);
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [options?.lang, options?.continuous, options?.interimResults]);
  const startListening = (0, import_react4.useCallback)(() => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
        setError(e.message);
      }
    }
  }, [isListening]);
  const stopListening = (0, import_react4.useCallback)(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);
  const resetTranscript = (0, import_react4.useCallback)(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);
  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isSupported
  };
}

// src/useSynapseAction.ts
var import_react5 = require("react");
function useSynapseActionRegistry(actions) {
  const actionsRef = (0, import_react5.useRef)(actions);
  (0, import_react5.useEffect)(() => {
    actionsRef.current = actions;
  });
  return (payload) => {
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

// src/index.ts
var import_core = require("@synapsenodes/core");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Agent,
  SynapseAvatar,
  SynapseProvider,
  createAgent,
  useAgent,
  useSynapse3D,
  useSynapseActionRegistry,
  useSynapseSpeech
});
