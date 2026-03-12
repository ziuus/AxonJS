import { useState, useRef, useEffect } from 'react';
import { useAgent, useSynapseActionRegistry } from '@synapsenodes/react';
import { useSynapseSignals } from '@synapsenodes/core/client';

function App() {
  const agent = useAgent();
  const [input, setInput] = useState('');
  const [log, setLog] = useState<{text: string; type: 'user' | 'agent' | 'tool' | 'error' | 'system'}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const actionHandler = useSynapseActionRegistry({
    changeTheme: (args) => {
      setLog(prev => [...prev, { text: `🎨 UI Action: Changed theme to ${args.theme}`, type: 'tool' }]);
      document.body.style.backgroundColor = args.theme === 'dark' ? '#0d0d14' : '#f8f8fc';
      document.body.style.color = args.theme === 'dark' ? '#fff' : '#000';
    },
    popConfetti: () => {
      setLog(prev => [...prev, { text: `🎉 UI Action: CONFETTI!`, type: 'tool' }]);
      alert("CONFETTI!");
    }
  });

  const { processSignals } = useSynapseSignals({
    EXECUTE_ACTION: actionHandler,
    ACTION_STATUS_UPDATE: ({ message, step, totalSteps }: any) => {
      const stepLabel = (step && totalSteps) ? ` [${step}/${totalSteps}]` : '';
      setLog(prev => [...prev, { text: `⏳${stepLabel} ${message}`, type: 'system' }]);
    },
    EXECUTE_ACTION_SEQUENCE: async ({ steps, description }: any) => {
      if (description) {
        setLog(prev => [...prev, { text: `🔄 Starting sequence: ${description}`, type: 'system' }]);
      }
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.statusMessage) {
          setLog(prev => [...prev, { text: `⏳ [${i + 1}/${steps.length}] ${step.statusMessage}`, type: 'system' }]);
          await new Promise(r => setTimeout(r, 400)); // brief delay so user can see each step
        }
        await actionHandler({ actionId: step.actionId, args: step.args });
      }
      setLog(prev => [...prev, { text: `✅ Sequence complete.`, type: 'system' }]);
    }
  });

  const handleRunAgent = async () => {
    if (!input || isThinking) return;
    const userInput = input;
    setInput('');
    setLog(prev => [...prev, { text: userInput, type: 'user' }]);
    setIsThinking(true);

    try {
      const response = await agent.run([{ role: 'user', content: userInput }]);
      setLog(prev => [...prev, { text: response.text, type: 'agent' }]);

      if (response.toolCalls && response.toolCalls.length > 0) {
        processSignals(response.toolCalls);
        response.toolCalls.forEach(call => {
          setLog(prev => [...prev, { text: `⚙️ ${call.name}(${JSON.stringify(call.args)})`, type: 'tool' }]);
        });
      }
    } catch (e: any) {
      setLog(prev => [...prev, { text: `Error: ${e.message}`, type: 'error' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const typeBubbleStyle = {
    user: 'bg-violet-600/80 text-white self-end rounded-2xl rounded-br-sm',
    agent: 'bg-white/5 border border-white/10 text-white self-start rounded-2xl rounded-bl-sm',
    tool: 'bg-indigo-900/40 text-indigo-300 self-start rounded-lg text-xs font-mono border border-indigo-500/20',
    error: 'bg-red-900/40 text-red-300 self-start rounded-lg border border-red-500/20',
    system: 'text-white/40 self-center text-xs italic',
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0d14] text-white flex flex-col items-center justify-center p-6 font-sans">
      {/* Header */}
      <div className="w-full max-w-2xl mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono mb-4">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
          SynapseJS Runtime
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
          Agent Playground
        </h1>
        <p className="text-white/40 text-sm mt-1">Test the SynapseJS agent runtime with tools and actions</p>
      </div>

      {/* Chat Container */}
      <div className="w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col overflow-hidden" style={{height: '60vh'}}>
        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {log.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <div className="text-4xl">🤖</div>
              <p className="text-white/30 text-sm max-w-xs">Agent is waiting. Try asking it to get the weather, navigate to a page, or change the theme.</p>
            </div>
          )}
          {log.map((entry, i) => (
            <div
              key={i}
              className={`max-w-[80%] px-4 py-2.5 ${typeBubbleStyle[entry.type]}`}
            >
              {entry.type === 'user' && <p className="text-xs font-semibold text-violet-200 mb-1">You</p>}
              {entry.type === 'agent' && <p className="text-xs font-semibold text-white/50 mb-1">Agent</p>}
              <p className="text-sm leading-relaxed">{entry.text}</p>
            </div>
          ))}
          {isThinking && (
            <div className="bg-white/5 border border-white/10 text-white/50 self-start rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce" style={{animationDelay:'0ms'}}>●</span>
                <span className="animate-bounce" style={{animationDelay:'150ms'}}>●</span>
                <span className="animate-bounce" style={{animationDelay:'300ms'}}>●</span>
              </span>
            </div>
          )}
          <div ref={logEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-3 flex gap-2">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask the agent something..."
            onKeyDown={e => e.key === 'Enter' && handleRunAgent()}
            disabled={isThinking}
          />
          <button
            onClick={handleRunAgent}
            disabled={isThinking || !input}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 active:scale-95"
          >
            Send
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-2xl mt-4 flex flex-wrap gap-2 justify-center">
        {['Get weather in Tokyo', 'Change theme to dark', 'Navigate to /dashboard', 'Send a text to Alice'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => { setInput(suggestion); }}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 text-xs transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
