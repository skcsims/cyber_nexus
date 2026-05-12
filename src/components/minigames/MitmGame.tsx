import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type Role } from '../../store/gameStore';
import { Shield, ShieldOff, Server, Router, Activity } from 'lucide-react';
import GameHUD from './GameHUD';
import GameCanvas from './GameCanvas';

interface Props {
  role: Role;
}

// =============================================================================
// TYPES
// =============================================================================

interface NetworkNode {
  id: number;
  x: number;
  y: number;
  type: 'server' | 'router' | 'client';
  health: number;
}

interface Packet {
  id: number;
  from: number;
  to: number;
  progress: number;
  phase: number;
  secure: boolean;
}

interface Connection {
  id: number;
  from: number;
  to: number;
  phase: number;
}

const PHASES = [
  { id: 0, color: '#38bdf8', name: 'ALPHA' },
  { id: 1, color: '#10b981', name: 'BETA' },
  { id: 2, color: '#a855f7', name: 'GAMMA' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function MitmGame({ role }: Props) {
  const isAttacker = role === 'attacker';
  const markLevelComplete = useGameStore((s) => s.markLevelComplete);
  const increaseBreach = useGameStore((s) => s.increaseBreach);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ===========================================================================
  // DEFENDER — ENCRYPTION FORTRESS
  // ===========================================================================
  const [nodes] = useState<NetworkNode[]>([
    { id: 1, x: 10, y: 50, type: 'server', health: 100 },
    { id: 2, x: 50, y: 20, type: 'router', health: 100 },
    { id: 3, x: 50, y: 80, type: 'router', health: 100 },
    { id: 4, x: 90, y: 50, type: 'client', health: 100 },
  ]);
  const [connections, setConnections] = useState<Connection[]>([
    { id: 1, from: 1, to: 2, phase: -1 },
    { id: 2, from: 1, to: 3, phase: -1 },
    { id: 3, from: 2, to: 4, phase: -1 },
    { id: 4, from: 3, to: 4, phase: -1 },
  ]);
  const [packets, setPackets] = useState<Packet[]>([]);

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;

    const spawnLoop = setInterval(() => {
      const conn = connections[Math.floor(Math.random() * connections.length)];
      const phase = Math.floor(Math.random() * 3);
      const newPacket: Packet = {
        id: Date.now(),
        from: conn.from,
        to: conn.to,
        progress: 0,
        phase,
        secure: false
      };
      setPackets(prev => [...prev, newPacket]);
    }, Math.max(1000, 2500 - wave * 400));

    const moveLoop = setInterval(() => {
      setPackets(prev => {
        let damage = 0;
        const next = prev.map(p => {
          const conn = connections.find(c => c.from === p.from && c.to === p.to)!;
          // Packet is secure if the link phase matches its phase
          const isCurrentlySecure = conn.phase === p.phase;
          return { ...p, progress: p.progress + 0.012, secure: isCurrentlySecure };
        }).filter(p => {
          if (p.progress >= 1) {
            if (!p.secure) damage += 15;
            else setScore(s => s + 50);
            return false;
          }
          return true;
        });
        
        if (damage > 0) {
          setHp(h => {
             const nextH = Math.max(0, h - damage);
             if (nextH <= 0) setGameState('lost');
             return nextH;
          });
          setCombo(0);
        } else if (next.length < prev.length) {
          setCombo(c => c + 1);
        }
        return next;
      });
    }, 16);

    return () => { clearInterval(spawnLoop); clearInterval(moveLoop); };
  }, [isAttacker, gameState, connections, wave]);

  const toggleShield = (connId: number) => {
    setConnections(prev => prev.map(c => {
      if (c.id === connId) {
        // Cycle: -1 -> 0 -> 1 -> 2 -> -1
        const nextPhase = c.phase >= 2 ? -1 : c.phase + 1;
        return { ...c, phase: nextPhase };
      }
      return c;
    }));
  };

  // ===========================================================================
  // ATTACKER — SIGNAL INTERCEPTOR
  // ===========================================================================
  const [frequencies, setFrequencies] = useState([
    { id: 1, target: 45, current: 10, locked: false, color: '#38bdf8' },
    { id: 2, target: 70, current: 90, locked: false, color: '#facc15' },
    { id: 3, target: 25, current: 50, locked: false, color: '#f87171' },
  ]);
  const [stealth, setStealth] = useState(100);

  useEffect(() => {
    if (!isAttacker || gameState !== 'playing') return;

    const loop = setInterval(() => {
      setFrequencies(prev => {
        let allLocked = true;
        const next = prev.map(f => {
          const diff = Math.abs(f.current - f.target);
          const isLocked = diff < 3;
          if (!isLocked) allLocked = false;
          return { ...f, locked: isLocked };
        });

        if (allLocked) {
          setScore(s => {
            const nextS = s + 5;
            if (nextS >= 1000) {
              setGameState('won');
              markLevelComplete('attacker', 4, 500);
            }
            return nextS;
          });
          setCombo(c => c + 1);
        } else {
          setStealth(s => {
             const nextS = Math.max(0, s - 0.1);
             if (nextS <= 0) {
               setGameState('lost');
               increaseBreach(20);
             }
             return nextS;
          });
        }
        return next;
      });
    }, 100);

    return () => clearInterval(loop);
  }, [isAttacker, gameState, markLevelComplete]);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="w-full h-[600px] flex flex-col p-6 bg-[#060609] relative overflow-hidden">
      <GameCanvas color={isAttacker ? '#ef4444' : '#38bdf8'} effects={['ambient', 'grid']} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />

      <GameHUD 
        isAttacker={isAttacker}
        title={isAttacker ? "SIGNAL INTERCEPTOR" : "ENCRYPTION FORTRESS"}
        subtitle={isAttacker ? "Intercept and decode multi-band data streams" : "Secure network pathways against data sniffing"}
        stats={[
          { label: isAttacker ? "Stealth" : "Net Health", value: isAttacker ? `${Math.floor(stealth)}%` : `${hp}%`, color: (isAttacker ? stealth < 30 : hp < 30) ? 'text-red-500' : 'text-emerald-400' },
          { label: "Packets", value: packets.length },
          { label: "Score", value: score }
        ]}
        combo={combo}
      />

      <div className="flex-1 relative glass-panel overflow-hidden flex items-center justify-center">
        
        {isAttacker ? (
          // ATTACKER: Spectrum Analyzer UI
          <div className="w-full h-full flex flex-col p-8 gap-8">
             <div className="flex-1 grid grid-rows-3 gap-4">
                {frequencies.map(f => (
                  <div key={f.id} className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center gap-6">
                     <div className="w-32 flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase">Band {f.id} <span style={{ color: f.color }}>{f.locked ? 'LOCKED' : 'SCANNING'}</span></div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div className="h-full" style={{ backgroundColor: f.color, width: `${100 - Math.abs(f.current - f.target)}%` }} />
                        </div>
                     </div>
                     <div className="flex-1 h-full bg-black/60 rounded-lg border border-white/5 relative overflow-hidden flex items-center">
                        <svg className="w-full h-12">
                           <path 
                             d={`M 0 24 ${Array.from({ length: 20 }).map((_, i) => `L ${i * 30} ${24 + Math.sin(i * f.current / 10 + Date.now()/100) * 15}`).join(' ')}`}
                             fill="none" stroke={f.color} strokeWidth="2" opacity={f.locked ? 1 : 0.4}
                           />
                        </svg>
                     </div>
                     <input 
                       type="range" min="0" max="100" value={f.current} 
                       onChange={(e) => setFrequencies(prev => prev.map(item => item.id === f.id ? { ...item, current: parseInt(e.target.value) } : item))}
                       className="w-48 accent-white" 
                     />
                  </div>
                ))}
             </div>
             
             <div className="h-32 bg-black/80 border border-white/5 rounded-xl p-4 font-mono text-[10px] text-emerald-500 overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-zinc-500">
                   <Activity className="w-3 h-3" /> DECODED_DATA_STREAM:
                </div>
                {score > 100 && <div>[PACKET_ID_827] SRC: 192.168.1.5 {"->"} DEST: 10.0.0.1</div>}
                {score > 300 && <div>[PAYLOAD_FRAG] AUTH_KEY: "0x8F22A1..."</div>}
                {score > 600 && <div>[INJECT_SUCCESS] BACKDOOR_LISTENER_ACTIVE</div>}
                <div className="animate-pulse">_</div>
             </div>
          </div>
        ) : (
          // DEFENDER: Topology UI
          <div className="w-full h-full relative flex flex-col p-8">
             <div className="absolute inset-0 grid-pulse opacity-5 pointer-events-none" />
             
             {/* Mission Instructions */}
             <div className="absolute top-8 left-8 z-50 pointer-events-none max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-6 bg-purple-500" />
                   <h3 className="text-xs font-display font-bold text-white uppercase tracking-widest">Mission: Phase Matcher</h3>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono leading-relaxed bg-black/40 backdrop-blur-md p-3 rounded border border-white/5">
                   INBOUND PACKETS ARE COLOR-CODED. <br/>
                   CLICK THE <span className="text-white">PATHS</span> TO CYCLE ENCRYPTION PHASES. <br/>
                   <span className="text-emerald-400">MATCH THE COLOR</span> TO SECURE THE TRANSMISSION.
                </p>
             </div>

             <div className="flex-1 relative glass-panel bg-black/20 border border-white/5 overflow-hidden">
                <svg className="absolute inset-0 w-full h-full">
                   {connections.map(conn => {
                     const from = nodes.find(n => n.id === conn.from)!;
                     const to = nodes.find(n => n.id === conn.to)!;
                     const phaseColor = conn.phase === -1 ? '#3f3f46' : PHASES[conn.phase].color;
                     
                     return (
                       <g key={conn.id} className="cursor-pointer group" onClick={() => toggleShield(conn.id)}>
                          {/* Invisible Wider Interaction Area */}
                          <line 
                            x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
                            stroke="transparent" strokeWidth="32"
                          />
                          {/* Actual Connection Line */}
                          <motion.line 
                            x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
                            animate={{ stroke: phaseColor, strokeWidth: conn.phase === -1 ? 2 : 5 }}
                            className={conn.phase !== -1 ? 'glow-pulse-blue' : 'group-hover:stroke-white/20'}
                          />
                          
                          {/* Phase Indicator Node */}
                          <motion.circle 
                            initial={false}
                            animate={{ 
                              cx: `${(from.x + to.x)/2}%`, 
                              cy: `${(from.y + to.y)/2}%`, 
                              r: 16,
                              fill: conn.phase === -1 ? '#000' : phaseColor,
                              stroke: '#fff',
                              strokeWidth: conn.phase === -1 ? 0 : 2
                            }}
                          />
                          <foreignObject 
                            x={`${(from.x + to.x)/2 - 1}%`} y={`${(from.y + to.y)/2 - 1}%`} 
                            width="30" height="30" 
                            className="pointer-events-none"
                            style={{ transform: `translate(-15px, -15px)` }}
                          >
                             <div className="w-full h-full flex items-center justify-center">
                                <span className="text-[7px] font-display font-black text-white">
                                   {conn.phase === -1 ? 'OFF' : PHASES[conn.phase].name[0]}
                                </span>
                             </div>
                          </foreignObject>
                       </g>
                     );
                   })}
                </svg>

                {/* Nodes */}
                {nodes.map(node => (
                  <div 
                    key={node.id}
                    className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-3 z-40"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                     <div className="w-12 h-12 bg-black border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-sky-500/0 group-hover:bg-sky-500/5 transition-colors" />
                        {node.type === 'server' ? <Server className="w-6 h-6 text-sky-400" /> : node.type === 'router' ? <Router className="w-6 h-6 text-zinc-500" /> : <Activity className="w-6 h-6 text-emerald-400" />}
                        <div className="absolute -bottom-1 w-full h-1 bg-white/5 overflow-hidden">
                           <motion.div className="h-full bg-sky-500" initial={{ width: '100%' }} animate={{ width: `${node.health}%` }} />
                        </div>
                     </div>
                     <span className="text-[8px] font-display font-bold text-zinc-500 uppercase tracking-[0.2em]">{node.type}</span>
                  </div>
                ))}

                {/* Packets */}
                <AnimatePresence>
                   {packets.map(p => {
                     const from = nodes.find(n => n.id === p.from)!;
                     const to = nodes.find(n => n.id === p.to)!;
                     const curX = from.x + (to.x - from.x) * p.progress;
                     const curY = from.y + (to.y - from.y) * p.progress;
                     const packetColor = PHASES[p.phase].color;
                     
                     return (
                       <motion.div
                         key={p.id}
                         className={`absolute w-5 h-5 rounded-full z-[100] flex items-center justify-center border-2 border-white shadow-xl`}
                         style={{ left: `${curX}%`, top: `${curY}%`, x: '-50%', y: '-50%', backgroundColor: packetColor, boxShadow: `0 0 15px ${packetColor}` }}
                         initial={{ scale: 0 }} 
                         animate={{ scale: 1 }}
                         exit={{ scale: 0, opacity: 0 }}
                       >
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                       </motion.div>
                     );
                   })}
                </AnimatePresence>
             </div>
          </div>
        )}

      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {gameState !== 'playing' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-10 rounded-2xl border text-center max-w-md ${gameState === 'won' ? 'border-emerald-500/30 shadow-neon-green' : 'border-red-500/30 shadow-neon-red'}`}
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${gameState === 'won' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                {gameState === 'won' ? <Shield className="w-8 h-8 text-emerald-400" /> : <ShieldOff className="w-8 h-8 text-red-400" />}
              </div>
              <h2 className={`font-display text-3xl font-bold mb-4 uppercase ${gameState === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
                {gameState === 'won' ? 'NETWORK SECURED' : 'DATA BREACHED'}
              </h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                {gameState === 'won' 
                  ? (isAttacker ? 'Signal intercept complete. Core data exfiltrated.' : 'Encryption tunnel maintained. Interceptor neutralized.') 
                  : (isAttacker ? 'Detection threshold exceeded. Stealth compromise.' : 'Man-in-the-middle attack successful. Data leak detected.')}
              </p>
              <button 
                onClick={() => setCurrentLevel(null)}
                className="cyber-btn w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display text-xs font-bold uppercase rounded-xl"
              >
                Return to Command Center
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
