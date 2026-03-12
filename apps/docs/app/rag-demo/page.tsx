'use client';

import { useState, useRef, useEffect } from 'react';
import { SynapseAvatar, useSynapseSpeech } from '@synapsenodes/react';

const Typewriter = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(index + 1);
      }, 20); // typing speed
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, onComplete]);

  return <span>{displayedText}</span>;
};

type Message = { role: 'user' | 'assistant'; content: string; fullContent?: string; toolCalls?: any[] };

export default function RAGDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your SynapseJS RAG Assistant. I can help you with technical documentation, animation framework details, and 3D engine integration." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [researchState, setResearchState] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState('idle');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, stopListening, isSupported, resetTranscript } = useSynapseSpeech({ continuous: true });

  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening) {
      stopListening();
    }
    resetTranscript();

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setResearchState('Embodying Character...');
    setAvatarState('thinking');
    setIsTyping(false);
    setVoiceText(null);

    try {
      const response = await fetch('/api/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages.filter(m => m.content), userMsg] }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      if (data.messages) {
        const lastMsg = data.messages[data.messages.length - 1];
        
        // Add new assistant message with fullContent for typewriter
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '', 
          fullContent: lastMsg.content, 
          toolCalls: lastMsg.toolCalls 
        }]);
        
        setIsTyping(true);
        setAvatarState('talking');
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error processing the response." }]);
        setAvatarState('failure');
      }
    } catch (err: any) {
      console.error("RAG Chat Error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I hit a snag: ${err.message}` }]);
      setAvatarState('failure');
    } finally {
      setIsLoading(false);
      setResearchState(null);
    }
  };

  const finalizeMessage = (index: number, content: string, toolCalls?: any[]) => {
    setMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs[index]) {
        newMsgs[index] = { ...newMsgs[index], content, fullContent: undefined };
      }
      return newMsgs;
    });
    
    setIsTyping(false);
    
    // Check if the character should switch to a specific post-talking state
    // For now, default to idle unless a 'nod' or 'agree' was part of the original tool calls
    const hasAgree = toolCalls?.some(tc => tc.args?.gesture === 'agree' || tc.args?.gesture === 'nod' || tc.args?.gesture === 'success');
    const hasFailure = toolCalls?.some(tc => tc.args?.gesture === 'failure' || tc.args?.gesture === 'disagree' || tc.args?.gesture === 'shakehead');
    
    if (hasAgree) {
        setAvatarState('success');
    } else if (hasFailure) {
        setAvatarState('failure');
    } else {
        setAvatarState('idle');
    }
    
    // Play voice if enabled
    if (isVoiceEnabled) {
      setVoiceText(content);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0a1a] to-[#000000] -z-10" />
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

      {/* Main Layout */}
      <div className="flex flex-1 relative pt-20 overflow-hidden h-[calc(100vh-80px)]">
        {/* Left: 3D Character */}
        <div className="flex-1 flex items-stretch justify-center relative min-h-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5">
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="w-full h-full max-w-4xl max-h-[800px] relative">
              <SynapseAvatar 
                modelUrl="https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/RobotExpressive/RobotExpressive.glb" 
                animationState={avatarState} 
                isTyping={isTyping} 
                speakText={voiceText}
                className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md transition-all"
              />
            </div>
          </div>
          {/* Legend/Context */}
          <div className="absolute bottom-10 left-10 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-xs z-20">
            <h3 className="text-sm font-bold text-indigo-400 mb-1">RAG Context Aware</h3>
            <p className="text-xs text-gray-400">The character triggers animations based on whether information is found in the SynapseJS Knowledge Base.</p>
          </div>
        </div>

        {/* Right: Chat Panel */}
        <div className="w-[450px] h-[calc(100vh-80px)] flex flex-col border-l border-white/10 bg-black/40 backdrop-blur-xl flex-shrink-0">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase italic drop-shadow-lg">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Synapse</span> RAG
              </h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-semibold">Knowledge Retrieval Bot</p>
            </div>
            
            <button 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-2 rounded-lg transition-all ${isVoiceEnabled ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 text-gray-500 border border-white/10 hover:text-white'}`}
              title={isVoiceEnabled ? "Voice Output On" : "Voice Output Off"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isVoiceEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" x2="1" y1="1" y2="23"></line>
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-lg backdrop-blur-sm transition-all duration-300 ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none border border-indigo-500/50' 
                    : 'bg-white/10 border border-white/20 text-white rounded-bl-none'
                }`}>
                  {m.role !== 'user' && (
                    <div className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" /> AI RESPONDING
                    </div>
                  )}
                  {m.role === 'assistant' && m.fullContent ? (
                    <Typewriter 
                      text={m.fullContent} 
                      onComplete={() => finalizeMessage(i, m.fullContent!, m.toolCalls)} 
                    />
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-indigo-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3 animate-pulse">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  </div>
                  {researchState}
                </div>
              </div>
            )}
            <div ref={scrollRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-black/60 flex-shrink-0">
            <form onSubmit={handleSubmit} className="relative flex items-center group gap-2">
              {isSupported && (
                <button 
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-3.5 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}
                  title={isListening ? "Stop Listening" : "Start Voice Input"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
              )}
              <div className="relative flex-1">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Ask documentation query..."}
                  className={`w-full bg-white/5 border rounded-2xl px-6 py-4.5 text-sm focus:outline-none focus:bg-white/10 transition-all pr-14 shadow-inner ${isListening ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-white/10 focus:border-indigo-500/50 group-hover:border-white/20'}`}
                />
                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 rounded-xl disabled:opacity-30 transition-all hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] active:scale-95"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </form>
            <p className="text-[9px] text-gray-500 text-center mt-3 uppercase tracking-tighter">Powered by SynapseJS Protocol v0.3.5</p>
          </div>
        </div>
      </div>

      {/* Navbar Overlay */}
      <nav className="fixed top-0 left-0 right-0 h-20 px-10 flex items-center justify-between border-b border-white/5 backdrop-blur-sm z-50">
        <div className="font-black text-2xl tracking-tighter">SynapseJS</div>
        <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-400">
          <a href="/" className="hover:text-white transition-colors">Docs Home</a>
          <a href="/rag-demo" className="text-indigo-400 underline decoration-2 underline-offset-8">RAG Demo</a>
        </div>
        <button className="px-5 py-2 rounded-full border border-white/20 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
          Connect Core
        </button>
      </nav>
    </div>
  );
}
