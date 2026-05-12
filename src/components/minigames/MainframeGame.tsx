import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type Role } from '../../store/gameStore';
import { Skull, RefreshCw, Globe, Trophy } from 'lucide-react';
import GameHUD from './GameHUD';
import GameCanvas, { spawnBurst } from './GameCanvas';

interface Props {
  role: Role;
}

// =============================================================================
// TYPES
// =============================================================================

interface Threat {
  id: number;
  type: 'laser' | 'drone' | 'data';
  angle: number;
  distance: number;
  speed: number;
  color: string;
}

interface CoreShield {
  id: number;
  type: 'reflect' | 'absorb' | 'deflect';
  angle: number;
  width: number;
  color: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function MainframeGame({ role }: Props) {
  const isAttacker = role === 'attacker';
  const markLevelComplete = useGameStore((s) => s.markLevelComplete);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave] = useState(1);
  const [overload, setOverload] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ===========================================================================
  // DEFENDER — SENTINEL CORE
  // ===========================================================================
  const [threats, setThreats] = useState<Threat[]>([]);
  const [shields] = useState<CoreShield[]>([
    { id: 1, type: 'reflect', angle: 0, width: 90, color: '#38bdf8' },
    { id: 2, type: 'absorb', angle: 120, width: 90, color: '#facc15' },
    { id: 3, type: 'deflect', angle: 240, width: 90, color: '#f87171' },
  ]);
  const [shieldRotation, setShieldRotation] = useState(0);

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;

    const spawnLoop = setInterval(() => {
      const types: Threat['type'][] = ['laser', 'drone', 'data'];
      const colors = ['#38bdf8', '#facc15', '#f87171'];
      const typeIdx = Math.floor(Math.random() * 3);
      
      const newThreat: Threat = {
        id: Date.now(),
        type: types[typeIdx],
        angle: Math.random() * 360,
        distance: 400,
        speed: 1.5 + (wave * 0.5),
        color: colors[typeIdx]
      };
      setThreats(prev => [...prev, newThreat]);
    }, Math.max(500, 1500 - wave * 200));

    const moveLoop = setInterval(() => {
      setThreats(prev => {
        let damage = 0;
        const next = prev.map(t => ({ ...t, distance: t.distance - t.speed }))
          .filter(t => {
            if (t.distance <= 40) {
              // Collision check with shields
              const normalizedAngle = (t.angle - shieldRotation + 360) % 360;
              const shield = shields.find(s => {
                const start = (s.angle - s.width/2 + 360) % 360;
                const end = (s.angle + s.width/2 + 360) % 360;
                if (start < end) return normalizedAngle >= start && normalizedAngle <= end;
                return normalizedAngle >= start || normalizedAngle <= end;
              });

              if (shield && shield.color === t.color) {
                setScore(s => s + 50);
                setCombo(c => c + 1);
                setOverload(o => Math.min(100, o + 2));
                const canvas = canvasRef.current;
                if (canvas) {
                  spawnBurst(canvas, canvas.width / 2, canvas.height / 2, t.color);
                }
                return false;
              } else {
                damage += 10;
                return false;
              }
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
        }
        return next;
      });
    }, 16);

    return () => { clearInterval(spawnLoop); clearInterval(moveLoop); };
  }, [isAttacker, gameState, shieldRotation, wave, score, markLevelComplete]);

  const handleShieldRotate = (dir: 'cw' | 'ccw') => {
    setShieldRotation(prev => (prev + (dir === 'cw' ? 15 : -15)) % 360);
  };

  const triggerOverload = () => {
    if (overload < 100) return;
    setThreats([]);
    setOverload(0);
    setScore(s => s + 500);
    spawnBurst(canvasRef.current, 400, 300, '#fff', 50);
  };

  useEffect(() => {
    if (score >= 5000 && !isAttacker && gameState === 'playing') {
      setGameState('won');
      markLevelComplete('defender', 8, 1000);
    }
  }, [score, isAttacker, gameState, markLevelComplete]);

  // ===========================================================================
  // ATTACKER — CORE BREACH
  // ===========================================================================
  const [resonance, setResonance] = useState(0);
  const [frequency, setFrequency] = useState(50);
  const [payloads, setPayloads] = useState<{ id: number, active: boolean, progress: number }[]>([]);
  const targetFreq = 73;

  useEffect(() => {
    if (!isAttacker || gameState !== 'playing') return;

    const loop = setInterval(() => {
      const diff = Math.abs(frequency - targetFreq);
      const isMatching = diff < 5;
      
      setResonance(r => {
        const nextR = isMatching ? Math.min(100, r + 1) : Math.max(0, r - 0.5);
        if (nextR >= 100) {
          setGameState('won');
          markLevelComplete('attacker', 8, 1000);
        }
        return nextR;
      });

      if (isMatching) {
        setScore(s => s + 10);
      }
    }, 100);

    return () => clearInterval(loop);
  }, [isAttacker, gameState, frequency, markLevelComplete]);

  const launchPayload = () => {
    if (payloads.length >= 5) return;
    setPayloads(prev => [...prev, { id: Date.now(), active: true, progress: 0 }]);
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="w-full h-[600px] flex flex-col p-6 bg-[#060609] relative overflow-hidden">
      <GameCanvas color={isAttacker ? '#ef4444' : '#fbbf24'} effects={['ambient', 'grid']} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />

      <GameHUD 
        isAttacker={isAttacker}
        title={isAttacker ? "CORE BREACH" : "SENTINEL CORE"}
        subtitle={isAttacker ? "Synchronize harmonics to destabilize the mainframe core" : "Protect the central processor from multi-vector attacks"}
        stats={[
          { label: isAttacker ? "Resonance" : "Core HP", value: isAttacker ? `${Math.floor(resonance)}%` : `${hp}%`, color: (isAttacker ? resonance > 70 : hp < 30) ? 'text-emerald-400' : 'text-red-400' },
          { label: "Alert", value: isAttacker ? "CRITICAL" : wave, color: 'text-amber-400' },
          { label: "Score", value: score }
        ]}
        combo={combo}
      />

      <div className="flex-1 relative glass-panel overflow-hidden flex items-center justify-center">
        
        {isAttacker ? (
          // ATTACKER: Core Breach UI
          <div className="w-full h-full p-12 flex flex-col items-center justify-center gap-12">
             <div className="relative">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 360],
                    boxShadow: [
                      '0 0 20px rgba(239,68,68,0.2)',
                      '0 0 60px rgba(239,68,68,0.4)',
                      '0 0 20px rgba(239,68,68,0.2)'
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-48 h-48 rounded-full border-4 border-red-500/50 flex items-center justify-center bg-red-500/10"
                >
                   <Skull className="w-20 h-20 text-red-500" />
                </motion.div>
                
                {/* Resonance Wave */}
                <svg className="absolute inset-0 -m-12 w-72 h-72 pointer-events-none">
                   <motion.circle 
                     cx="144" cy="144" r="100" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="10,10"
                     animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                     transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                   />
                </svg>
             </div>

             <div className="w-full max-w-xl space-y-8">
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-display font-bold text-zinc-400 uppercase tracking-widest">
                      <span>Frequency Sync</span>
                      <span className={Math.abs(frequency - targetFreq) < 5 ? 'text-emerald-400' : 'text-red-400'}>{frequency} Hz</span>
                   </div>
                   <input 
                     type="range" min="0" max="100" value={frequency} 
                     onChange={(e) => setFrequency(parseInt(e.target.value))}
                     className="w-full accent-red-500" 
                   />
                </div>
                
                <div className="flex justify-center gap-4">
                   <button 
                     onClick={launchPayload}
                     className="px-12 py-4 bg-red-600 border border-red-400 rounded-xl font-display text-xs font-bold text-white uppercase tracking-widest shadow-neon-red hover:scale-105 active:scale-95 transition-all"
                   >
                      Inject Disruptor
                   </button>
                </div>
             </div>
          </div>
        ) : (
          // DEFENDER: Sentinel Core UI
          <div className="w-full h-full relative flex items-center justify-center">
             {/* Central Core */}
             <motion.div 
               animate={{ 
                 scale: [1, 1.05, 1],
                 rotate: [0, -360]
               }}
               transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
               className="w-40 h-40 rounded-full bg-sky-500/10 border-2 border-sky-500/30 flex items-center justify-center relative shadow-inner-glow"
             >
                <Globe className="w-16 h-16 text-sky-400 animate-pulse" />
                <div className="absolute inset-0 rounded-full border border-sky-500/20 animate-ping" />
             </motion.div>

             {/* Rotating Shields */}
             <div 
               className="absolute w-80 h-80 transition-transform duration-200"
               style={{ transform: `rotate(${shieldRotation}deg)` }}
             >
                {shields.map(s => (
                  <div 
                    key={s.id}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from ${s.angle - s.width/2}deg, ${s.color} 0deg, ${s.color} ${s.width}deg, transparent ${s.width}deg)`,
                      maskImage: 'radial-gradient(transparent 90%, black 91%)',
                      WebkitMaskImage: 'radial-gradient(transparent 90%, black 91%)',
                      opacity: 0.8
                    }}
                  />
                ))}
             </div>

             {/* Threats */}
             {threats.map(t => (
               <div 
                 key={t.id}
                 className="absolute w-4 h-4 rounded-full shadow-lg"
                 style={{
                   top: `calc(50% + ${Math.sin(t.angle * Math.PI / 180) * t.distance}px)`,
                   left: `calc(50% + ${Math.cos(t.angle * Math.PI / 180) * t.distance}px)`,
                   backgroundColor: t.color,
                   boxShadow: `0 0 15px ${t.color}`
                 }}
               />
             ))}

             {/* Controls */}
             <div className="absolute bottom-8 flex gap-8 z-30">
                <button onClick={() => handleShieldRotate('ccw')} className="p-4 bg-black/60 border border-white/10 rounded-xl hover:bg-sky-500/20 transition-all">
                   <RefreshCw className="w-6 h-6 text-sky-400 rotate-180" />
                </button>
                
                <button 
                  onClick={() => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      spawnBurst(canvas, canvas.width / 2, canvas.height / 2, '#f59e0b', 40);
                    }
                    triggerOverload();
                  }}
                  disabled={overload < 100}
                  className={`px-12 py-4 rounded-xl border font-display text-xs font-bold uppercase tracking-widest transition-all ${overload >= 100 ? 'bg-amber-500 border-amber-400 shadow-neon-amber animate-bounce' : 'bg-black/40 border-white/10 text-zinc-600'}`}
                >
                   Overload Core [{overload}%]
                </button>

                <button onClick={() => handleShieldRotate('cw')} className="p-4 bg-black/60 border border-white/10 rounded-xl hover:bg-sky-500/20 transition-all">
                   <RefreshCw className="w-6 h-6 text-sky-400" />
                </button>
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
              className={`p-10 rounded-2xl border text-center max-w-md ${gameState === 'won' ? 'border-amber-500/30 shadow-neon-amber' : 'border-red-500/30 shadow-neon-red'}`}
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${gameState === 'won' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                {gameState === 'won' ? <Trophy className="w-8 h-8 text-amber-400" /> : <Skull className="w-8 h-8 text-red-400" />}
              </div>
              <h2 className={`font-display text-3xl font-bold mb-4 uppercase ${gameState === 'won' ? 'text-amber-400' : 'text-red-400'}`}>
                {gameState === 'won' ? 'MAINFRAME DOMINATED' : 'CORE BREACHED'}
              </h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                {gameState === 'won' 
                  ? (isAttacker ? 'Final security layer collapsed. The Castle is under your absolute control.' : 'All threats neutralized. The Sentinel Core has secured the entire network infrastructure.') 
                  : (isAttacker ? 'System failsafe triggered. Your breach attempt was countered.' : 'The core has been compromised. The network is falling into chaos.')}
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
