import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, PerspectiveCamera, OrbitControls, Sphere } from '@react-three/drei';
import { useSynapseSignals, useSynapseSpeech, SuggestionChips } from '@synapsenodes/react';
import { Building2, MapPin, Sparkles, Navigation, Send, Menu, X } from 'lucide-react';
import gsap from 'gsap';

const PropertyCard = ({ title, price, location, features }: any) => {
  return (
    <div 
      className="glass-card p-6 flex flex-col gap-4 cursor-pointer group transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="relative h-48 rounded-2xl overflow-hidden bg-white/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6199f7f009?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute top-4 right-4 bg-[#fb923c] text-black px-3 py-1 rounded-full text-xs font-bold font-mono">
            {price}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-white/60 flex items-center gap-1 text-sm"><MapPin size={14} /> {location}</p>
      </div>
      <div className="flex gap-2">
        {features.map((f: string) => (
          <span key={f} className="text-[10px] px-2 py-1 rounded-md border border-white/5 bg-white/5 uppercase tracking-wider">{f}</span>
        ))}
      </div>
    </div>
  );
};

const Scene = () => {
    const sphereRef = useRef<any>(null);
    useFrame((state) => {
      if (sphereRef.current) {
        sphereRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
        sphereRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      }
    });

    return (
      <>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <Sphere ref={sphereRef} args={[1, 64, 64]} scale={1.5}>
            <MeshDistortMaterial
              color="#4c1d95"
              attach="material"
              distort={0.4}
              speed={4}
              roughness={0}
              metalness={1}
            />
          </Sphere>
        </Float>
      </>
    );
};

export default function App() {
  const [input, setInput] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { signals, runAgent, isProcessing } = useSynapseSignals();
  const { isListening } = useSynapseSpeech();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [signals]);

  useEffect(() => {
    if (mainContentRef.current) {
        gsap.fromTo(mainContentRef.current.children, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power4.out" }
        );
    }
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    runAgent(input);
    setInput('');
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden flex bg-[#020617] text-white font-['Space_Grotesk']">
      {/* Background 3D Portal */}
      <div className="absolute top-0 right-0 w-3/4 h-full pointer-events-none opacity-40">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <Suspense fallback={null}>
            <Scene />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Suspense>
        </Canvas>
      </div>

      {/* Floating UI Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 px-8 py-4 glass-card">
        <div className="flex items-center gap-2">
            <Building2 className="text-[#fb923c]" />
            <span className="font-bold tracking-tighter text-2xl uppercase">Zenith</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70 uppercase tracking-widest">
            <a href="#" className="hover:text-[#fb923c] transition-colors">Experience</a>
            <a href="#" className="hover:text-[#fb923c] transition-colors">Listings</a>
            <a href="#" className="hover:text-[#fb923c] transition-colors">Curated</a>
        </div>
      </nav>

      {/* Sidebar Orchestration Panel */}
      <aside className={`relative z-40 h-full flex flex-col p-6 pt-24 transition-all duration-500 ${isSidebarOpen ? 'w-[400px]' : 'w-20'}`}>
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="glass-card flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-[#fb923c] animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Concierge Online</span>
                </div>
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                    {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {isSidebarOpen && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {signals.map((s: any, i: number) => (
                    <div key={i} className={`flex flex-col ${s.type === 'response' ? 'items-start' : 'items-end'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        s.type === 'response' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-[#4c1d95]/40 border border-[#4c1d95]/50'
                      }`}>
                        {s.content}
                      </div>
                      {s.toolCalls?.map((t: any) => (
                         <div key={t.id} className="mt-2 text-[10px] uppercase font-bold tracking-tighter text-[#fb923c] flex items-center gap-1">
                            <Navigation size={10} /> Running {t.name}...
                         </div>
                      ))}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 space-y-4">
                  <SuggestionChips 
                    suggestions={['View the Penthouse', 'Book a virtual tour', 'Modern Architectural Gems']} 
                    onSelect={(s) => runAgent(s)}
                    className="flex-wrap"
                  />
                  <div className="relative">
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask the concierge..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:border-[#4c1d95] transition-all"
                    />
                    <button 
                      onClick={handleSend}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#4c1d95] rounded-xl text-white hover:bg-[#4c1d95]/80 transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainContentRef} className="flex-1 relative z-30 h-full p-6 pt-24 overflow-y-auto no-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12">
          <header className="space-y-4">
              <h1 className="text-7xl font-bold tracking-tighter">
                Discover <span className="text-[#fb923c] italic">Zenithal</span> Living.
              </h1>
              <p className="text-xl text-white/50 max-w-2xl font-light leading-relaxed">
                Explore hand-picked luxury architecture in a fully immersive digital twin environment, guided by our advanced AI concierge.
              </p>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
              <PropertyCard 
                title="The Obsidian Spire" 
                price="$24,500,000" 
                location="Bordeaux, France"
                features={['BRUTALIST', '12,000 SQFT', 'PANORAMIC']}
              />
              <PropertyCard 
                title="Crystal Horizon" 
                price="$18,900,000" 
                location="Malibu, California"
                features={['MINIMALIST', 'GLASS WALLS', 'INFINITY POOL']}
              />
              <PropertyCard 
                title="Aura Gardens" 
                price="$32,000,000" 
                location="Kyoto, Japan"
                features={['ZEN', 'SUSTAINABLE', 'MODERN TEA HOUSE']}
              />
          </section>
        </div>
      </main>

      {/* HUD Visualizers */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-4">
        <div className={`p-4 glass-card flex items-center gap-4 transition-all duration-500 ${isListening ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-90'}`}>
            <div className="flex gap-1 items-end h-4 w-12">
                {[1, 2, 3, 4, 5].map(b => (
                    <div key={b} className="flex-1 bg-[#fb923c] animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${b * 0.1}s` }} />
                ))}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fb923c]">Agent Online</span>
        </div>
        <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center text-[#fb923c] animate-pulse">
            <Sparkles size={24} />
        </div>
      </div>
    </div>
  );
}
