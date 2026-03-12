// @ts-nocheck
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useSynapse3D } from './useSynapse3D';
import * as THREE from 'three';

interface SynapseAvatarProps {
  modelUrl: string;
  animationState?: string;
  isTyping?: boolean;
  speakText?: string | null;
  scale?: number;
  position?: [number, number, number];
}

function AvatarModel({ modelUrl, animationState = 'idle', isTyping = false, speakText, scale = 0.7, position = [0, -1.8, 0] }: SynapseAvatarProps) {
  const { scene, animations } = useGLTF(modelUrl);
  const avatarRef = useRef<THREE.Group>(null);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const currentAction = useRef<THREE.AnimationAction | null>(null);
  const idleAction = useRef<THREE.AnimationAction | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Register the avatar scene to Synapse interop
  useSynapse3D(scene);

  // Initialize Animation Mixer
  useEffect(() => {
    if (scene && animations.length) {
      mixer.current = new THREE.AnimationMixer(scene);
      const idle = mixer.current.clipAction(animations.find(a => a.name === 'Idle') || animations[0]);
      idle.play();
      currentAction.current = idle;
      idleAction.current = idle;

      const onFinished = (e: any) => {
        // Revert to idle when a gesture finishes
        if (e.action !== idleAction.current && idleAction.current) {
          idleAction.current.reset().fadeIn(0.5).play();
          currentAction.current = idleAction.current;
        }
      };

      mixer.current.addEventListener('finished', onFinished);
      return () => {
        mixer.current?.removeEventListener('finished', onFinished);
      };
    }
  }, [scene, animations]);

  const [isRotating, setIsRotating] = useState(false);
  const rotationProgress = useRef(0);
  const pulseTimer = useRef<NodeJS.Timeout | null>(null);

  // Synapse interaction logic
  useFrame((state, delta) => {
    if (mixer.current) mixer.current.update(delta);
    
    // Rotation logic
    if (isRotating && avatarRef.current) {
      rotationProgress.current += delta * 4; // speed
      avatarRef.current.rotation.y += delta * 4;
      if (rotationProgress.current >= Math.PI * 2) {
        avatarRef.current.rotation.y = 0;
        rotationProgress.current = 0;
        setIsRotating(false);
      }
    }
    
    // Pseudo lip-sync/head-bob logic
    if (isSpeaking && avatarRef.current) {
        const head = scene.getObjectByName('Head') || scene.getObjectByName('mixamorig_Head') || scene.getObjectByName('Neck');
        if (head) {
           head.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.05; // tiny vibration to simulate talking
        }
    }

    // Check for signals in userData (set by our useSynapse3D bridge)
    if (scene) {
      const synapseData = scene.userData.synapseValue;
      if (synapseData) {
        const payload = synapseData?.payload || synapseData;
        const isLookAt = payload?.target === 'user' || payload?.target === 'lookAtTarget' || payload?.target?.target === 'user';
        
        if (isLookAt) {
          const head = scene.getObjectByName('Head') || scene.getObjectByName('mixamorig_Head') || scene.getObjectByName('Neck');
          if (head) {
            head.lookAt(state.camera.position);
          }
        }
      }
    }
  });

  const playAnimation = (targetAnimName: string) => {
    if (!mixer.current || !animations.length) return;

    const normalizedTargetAnimName = String(targetAnimName).toLowerCase().replace(/[^a-z]/g, '');

    if (normalizedTargetAnimName === 'rotate' || normalizedTargetAnimName === 'spin' || normalizedTargetAnimName === 'turnaround') {
      setIsRotating(true);
      rotationProgress.current = 0;
      return;
    }

    const mapping: Record<string, string> = {
      wave: 'Wave', jump: 'Jump', dance: 'Dance',
      nod: 'Yes', yes: 'Yes', agree: 'Yes',
      shakehead: 'No', no: 'No', disagree: 'No',
      punch: 'Punch', idle: 'Idle',
      walk: 'Walking', walking: 'Walking',
      talk: 'Idle', talking: 'Idle', 
      searching: 'Standing', thinking: 'Idle',
      success: 'Yes', failure: 'No'
    };
    const mappedName = mapping[normalizedTargetAnimName] || targetAnimName;

    const actionAnim = animations.find(a => 
        a.name.toLowerCase() === mappedName.toLowerCase() || 
        a.name.toLowerCase() === normalizedTargetAnimName
    );

    if (actionAnim) {
      const nextAction = mixer.current.clipAction(actionAnim);
      if (currentAction.current && currentAction.current !== nextAction) {
        const isTalkGesture = normalizedTargetAnimName.startsWith('talk');

        // Talking should not be an infinite wave. We mapped talk to Idle.
        if (actionAnim.name === 'Talking') {
            nextAction.setLoop(THREE.LoopRepeat, Infinity);
        } else if (actionAnim.name !== 'Idle' && actionAnim.name !== 'Dance') {
            nextAction.setLoop(THREE.LoopOnce, 1);
            nextAction.clampWhenFinished = true;
        } else if (actionAnim.name === 'Dance') {
            nextAction.setLoop(THREE.LoopRepeat, 3);
            nextAction.clampWhenFinished = true;
        }
        
        currentAction.current.fadeOut(0.2);
        nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.2).play();
        currentAction.current = nextAction;
      }
    }
  };

  // State-driven animation
  useEffect(() => {
    if (animationState) {
        playAnimation(animationState);
    }
  }, [animationState, animations]);

  // Handle TTS
  useEffect(() => {
    if (speakText && typeof window !== 'undefined' && 'speechSynthesis' in window) {
       // stop any existing speech
       window.speechSynthesis.cancel();

       const msg = new SpeechSynthesisUtterance(speakText);
       
       // Pick a good generic voice
       const voices = window.speechSynthesis.getVoices();
       const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.lang === 'en-US');
       if (preferredVoice) msg.voice = preferredVoice;

       msg.pitch = 1.1; // Make it sound slightly robotic/chipper
       msg.rate = 1.05;

       msg.onstart = () => {
           setIsSpeaking(true);
           playAnimation('talk');
       };
       msg.onend = () => {
           setIsSpeaking(false);
           if (!isTyping) playAnimation('idle');
       };
       msg.onerror = (e) => {
           console.error("Speech Synthesis Error:", e);
           setIsSpeaking(false);
       };

       window.speechSynthesis.speak(msg);
    }
  }, [speakText]);

  // Handle typing or speaking pulses
  useEffect(() => {
    if (isTyping || isSpeaking) {
        if (!pulseTimer.current) {
            pulseTimer.current = setInterval(() => {
                // Pick random subtle gestures to mix in so it isn't static
                const gestures = ['idle', 'idle', 'idle', 'idle', 'nod', 'shakehead'];
                const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
                playAnimation(randomGesture);
            }, 2500); // Pulse every 2.5 seconds
        }
    } else {
        if (pulseTimer.current) {
            clearInterval(pulseTimer.current);
            pulseTimer.current = null;
        }
        if (animationState !== 'success' && animationState !== 'failure' && !speakText) {
             playAnimation('idle');
        }
    }

    return () => {
        if (pulseTimer.current) {
            clearInterval(pulseTimer.current);
            pulseTimer.current = null;
        }
    }
  }, [isTyping, isSpeaking, animations, animationState, speakText]);

  return <primitive ref={avatarRef} object={scene} scale={scale} position={position} />;
}

export function SynapseAvatar({ 
    modelUrl, 
    animationState, 
    isTyping, 
    speakText,
    className = "relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md",
    showBadge = true
}: SynapseAvatarProps & { className?: string, showBadge?: boolean }) {
  const [pulse, setPulse] = useState(false);
  const lightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
      setPulse(animationState === 'searching' || animationState === 'thinking');
  }, [animationState]);

  // Simple light pulse component to keep canvas clean
  const SceneLights = () => {
    useFrame(({ clock }) => {
        if (lightRef.current && pulse) {
          lightRef.current.intensity = 1 + Math.sin(clock.elapsedTime * 15) * 0.8;
        } else if (lightRef.current) {
          lightRef.current.intensity = 1;
        }
    });
    return (
        <>
          <ambientLight intensity={0.4} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight ref={lightRef} position={[2, 2, 2]} color="#6366f1" intensity={1} />
        </>
    );
  }

  return (
    <div className={className}>
      {showBadge && (
        <div className="absolute top-4 left-4 z-10 bg-black/60 px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono text-white/70">
          GLTF RUNTIME (SYNAPSE AVATAR)
        </div>
      )}
      
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <SceneLights />
          
          <Suspense fallback={null}>
            <AvatarModel modelUrl={modelUrl} animationState={animationState} isTyping={isTyping} speakText={speakText} />
            <Environment preset="city" />
            <ContactShadows opacity={0.4} scale={10} blur={1} far={10} resolution={256} color="#000000" />
          </Suspense>
          
          <OrbitControls 
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            target={[0, -0.5, 0]}
          />
        </Canvas>
    </div>
  );
}
