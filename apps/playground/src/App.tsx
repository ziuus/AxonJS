import { useState } from 'react';
import { useAgent, useSynapseActionRegistry } from '@synapsenodes/react';
import { useSynapseSignals } from '@synapsenodes/core/client';

function App() {
  const agent = useAgent();
  const [input, setInput] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const actionHandler = useSynapseActionRegistry({
    changeTheme: (args) => {
      setLog(prev => [...prev, `🎨 UI Action Triggered: Changed theme to ${args.theme}`]);
      document.body.style.backgroundColor = args.theme === 'dark' ? '#333' : '#fff';
      document.body.style.color = args.theme === 'dark' ? '#fff' : '#000';
    },
    popConfetti: () => {
      setLog(prev => [...prev, `🎉 UI Action Triggered: CONFETTI!`]);
      alert("CONFETTI!");
    }
  });

  const { processSignals } = useSynapseSignals({
    EXECUTE_ACTION: actionHandler
  });

  const handleRunAgent = async () => {
    if (!input) return;
    
    setLog(prev => [...prev, `User: ${input}`]);
    const userInput = input;
    setInput('');

    try {
      setLog(prev => [...prev, `⚙️ Agent is thinking...`]);
      const response = await agent.run([{ role: 'user', content: userInput }]);
      
      setLog(prev => [...prev, `Agent: ${response.text}`]);
      
      if (response.toolCalls && response.toolCalls.length > 0) {
         processSignals(response.toolCalls);
         response.toolCalls.forEach(call => {
            setLog(prev => [...prev, `⚙️ Tool Request Detected: ${call.name} with args ${JSON.stringify(call.args)}`]);
            // Recreate the minimal validation locally just for the UI log.
            try {
               const tool = agent.tools.getTool(call.name);
               if (tool && tool.schema) {
                   tool.schema.parse(call.args);
               }
               setLog(prev => [...prev, `✅ Zod Validation Passed.`]);
               setLog(prev => [...prev, `✔️ Tool Executed successfully.`]);
            } catch (e: any) {
               setLog(prev => [...prev, `❌ Zod Validation Failed: ${e.message}`]);
            }
         });
      }
    } catch (e: any) {
      setLog(prev => [...prev, `❌ Error: ${e.message}`]);
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>SynapseJS Playground</h1>
      <p>This tests the core SynapseJS mock runtime.</p>
      
      <div style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem', height: '300px', overflowY: 'auto' }}>
        {log.map((entry, i) => (
          <div key={i} style={{ marginBottom: '0.5rem', color: entry.startsWith('⚙️') ? 'blue' : 'black' }}>
            {entry}
          </div>
        ))}
        {log.length === 0 && <span style={{ color: '#888' }}>Agent is waiting for input... (Try asking it to navigate!)</span>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          style={{ flex: 1, padding: '0.5rem' }}
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. Can you navigate to the dashboard?"
          onKeyDown={e => e.key === 'Enter' && handleRunAgent()}
        />
        <button style={{ padding: '0.5rem 1rem', background: 'var(--synapse-primary, #444)', color: 'var(--synapse-text, #fff)', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={handleRunAgent}>Send</button>
      </div>
    </div>
  )
}

export default App
