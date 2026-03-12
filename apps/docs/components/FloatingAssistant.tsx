'use client';

import { useEffect, useState } from 'react';
import { useSynapseDOM, useSynapseSignals } from '@synapsenodes/core/client';

export function FloatingAssistant() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const domElements = useSynapseDOM();
  const { processSignals } = useSynapseSignals({
    HIGHLIGHT_ELEMENT: (args) => {
      if (!args) return;
      const elementId = args.elementId || args.id;
      if (!elementId) return;
      const el = document.getElementById(elementId);
      if (el) {
        el.classList.add('synapse-highlight-active');
        setTimeout(() => el.classList.remove('synapse-highlight-active'), 3000);
      }
    },
    SCROLL_TO: (args) => {
      if (!args) return;
      const { elementId, top } = args;
      if (elementId) {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
      } else if (top !== undefined) {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    },
    NAVIGATE: (args) => {
      if (!args) return;
      const url = args.url || args.path;
      if (!url) return;
      window.location.href = url;
    },
    UI_INTERACTION: (args) => {
       if (!args || !args.elementId) return;
       const { elementId, action } = args;
       const el = document.getElementById(elementId);
       if (!el) return;
       if (action === 'click') {
          el.click();
       } else if (action === 'type' && args.value) {
          (el as any).value = args.value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
       }
    }
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: 'user', content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, domElements })
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      } else if (data.error) {
        setMessages([...history, { role: 'assistant', content: `⚠️ Error: ${data.error}` }]);
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setMessages([...history, { role: 'assistant', content: "⚠️ Connection error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && (lastMsg as any).toolCalls) {
        const tcs = (lastMsg as any).toolCalls;
        
        // Pass to standard hook handler (needs .name mapping)
        processSignals(tcs);
        
        // Explicitly handle raw 3D_INTERACTION signals
        tcs.forEach((tc: any) => {
            console.log('[FloatingAssistant] Processing tool call:', tc);
            if (tc._synapseSignal === '3D_INTERACTION' || tc.name === 'triggerContextualAnimation' || tc.name === 'performGesture') {
                const payload = tc.payload || { actionType: 'emitEvent', target: tc.args?.animationName || tc.args?.gesture || tc.args?.target };
                console.log('[FloatingAssistant] Constructed 3D Payload:', payload);
                const w = window as any;
                
                // Use our direct, bulletproof bypass function
                if (typeof w.playRobotAnimation === 'function') {
                    console.log('[FloatingAssistant] Calling window.playRobotAnimation with:', payload.target);
                    w.playRobotAnimation(payload.target);
                } else if (w.Synapse3D && w.Synapse3D.app) {
                    w.Synapse3D.app.userData.synapseValue = payload;
                    console.log('[FloatingAssistant] Injected payload into Three.js scene Object3D:', w.Synapse3D.app);
                } else {
                    console.error('[FloatingAssistant] No 3D interaction hook found! Cannot forward 3D signal.');
                }
            }
        });
    }
  }, [messages, processSignals]);

  const chatMessages = messages.length > 0 ? messages.map(m => ({ 
    role: m.role === 'user' ? 'user' : 'ai', 
    text: m.content 
  })) : [
    { role: 'ai', text: "👋 I'm the SynapseJS demo agent. I can control this page in real time.<br><br>Try: <em>\"Go to the docs\"</em>" }
  ];

  return (
    <>
      <button 
        id="synapse-fab" 
        className="assistant-fab"
        onClick={() => setIsAssistantOpen(!isAssistantOpen)}
      >
        <div className="fab-icon" style={{ fontSize: '1.5rem' }}>{isAssistantOpen ? '✕' : '⚡'}</div>
      </button>

      {/* Assistant Widget */}
      <div id="synapse-assistant" className={isAssistantOpen ? 'active' : ''}>
        <div className="assistant-header">
          <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
            <div className="fab-icon" style={{background:'var(--accent)', borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem'}}>⚡</div>
            <span className="assistant-title">Synapse Agent</span>
          </div>
          <span className="assistant-status">Online</span>
        </div>
        
        <div className="assistant-chat" id="chat-box">
          {chatMessages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'ai' ? 'msg-ai' : 'msg-user'}`} dangerouslySetInnerHTML={{ __html: m.text }} />
          ))}
          {isLoading && (
            <div className="msg msg-ai loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          )}
        </div>

        <div className="assistant-input-row">
          <input 
            type="text" 
            id="ai-input" 
            placeholder="Type a command..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <button className="send-btn" id="chat-send-btn" onClick={handleSend} disabled={isLoading}>
            ➙
          </button>
        </div>
      </div>
    </>
  );
}
