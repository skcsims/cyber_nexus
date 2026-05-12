import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type Role } from '../../store/gameStore';
import { Shield, Skull, Server, Zap, Snowflake, CheckCircle2 } from 'lucide-react';
import GameHUD from './GameHUD';
import GameCanvas, { spawnBurst } from './GameCanvas';

interface Props {
  role: Role;
}

// =============================================================================
// TYPES
// =============================================================================

type GameState = 'playing' | 'won' | 'lost';

interface Projectile {
  id: number;
  x: number; // 0 to 100
  y: number; // 0 to 100
  speed: number;
  type: 'standard' | 'heavy' | 'fast' | 'boss';
  lane: number;
  hp: number;
  maxHp: number;
}

interface Firewall {
  id: number;
  lane: number;
  type: 'ice' | 'emp' | 'data';
  health: number;
  active: boolean;
  x: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function FirewallSetupGame({ role }: Props) {
  const isAttacker = role === 'attacker';
  const markLevelComplete = useGameStore((s) => s.markLevelComplete);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);

  const [gameState, setGameState] = useState<GameState>('playing');
  const [hp, setHp] = useState(100);
  const [wave, setWave] = useState(1);
  const [combo, setCombo] = useState(0);
  const [inventory, setInventory] = useState({ ice: 3, data: 3, emp: 1 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ===========================================================================
  // DEFENDER — FORTRESS PROTOCOL
  // ===========================================================================
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [firewalls, setFirewalls] = useState<Firewall[]>([]);
  const [selectedFirewall, setSelectedFirewall] = useState<'ice' | 'emp' | 'data'>('ice');
  
  const lastSpawnRef = useRef(0);
  const gameTimeRef = useRef(0);

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;

    const loop = setInterval(() => {
      gameTimeRef.current += 16;
      
      // Spawn logic - relaxed for better balance
      const baseSpawnRate = Math.max(500, 1500 - wave * 300);
      if (gameTimeRef.current - lastSpawnRef.current > baseSpawnRate) {
        const lane = Math.floor(Math.random() * 3);
        const types: Projectile['type'][] = ['standard', 'fast', 'heavy'];
        const type = types[Math.floor(Math.random() * (wave > 1 ? 3 : 1))];
        
        // Relaxed speed multipliers
        const speedMult = 1.0 + (wave - 1) * 0.15;
        const newProj: Projectile = {
          id: Date.now(),
          x: 5,
          y: 0,
          speed: (type === 'fast' ? 0.6 : type === 'heavy' ? 0.2 : 0.4) * speedMult,
          type,
          lane,
          hp: type === 'heavy' ? 4 : 1,
          maxHp: type === 'heavy' ? 4 : 1,
        };
        setProjectiles(prev => [...prev, newProj]);
        lastSpawnRef.current = gameTimeRef.current;
      }

      // Update positions
      setProjectiles(prev => {
        let damaged = 0;
        const next = prev.map(p => ({ ...p, x: p.x + p.speed })).filter(p => {
          if (p.x >= 92) {
            damaged += p.type === 'heavy' ? 30 : 20;
            return false;
          }
          return true;
        });

        if (damaged > 0) {
          setHp(prevHp => {
            const nextHp = Math.max(0, prevHp - damaged);
            if (nextHp <= 0) setGameState('lost');
            return nextHp;
          });
          setCombo(0);
        }
        return next;
      });

      // Wave progression - fast-tracked (10s per wave)
      if (gameTimeRef.current > 10000 && wave === 1) setWave(2);
      if (gameTimeRef.current > 20000 && wave === 2) setWave(3);
      if (gameTimeRef.current > 30000 && wave === 3) {
        setGameState('won');
        markLevelComplete('defender', 1, 300);
      }

    }, 16);

    return () => clearInterval(loop);
  }, [isAttacker, gameState, wave, markLevelComplete]);

  const handleLaneClick = (e: React.MouseEvent, lane: number) => {
    if (gameState !== 'playing' || isAttacker) return;
    if (selectedFirewall !== 'emp' && inventory[selectedFirewall as keyof typeof inventory] <= 0) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;

    // Boundary check
    if (x < 15 || x > 90) return;

    const existing = firewalls.find(f => f.lane === lane && f.active && Math.abs(f.x - x) < 8);
    if (existing) return;

    const newFirewall: Firewall = {
      id: Date.now(),
      lane,
      type: selectedFirewall,
      health: selectedFirewall === 'data' ? 3 : selectedFirewall === 'emp' ? 1 : 2,
      active: true,
      x: x,
    };

    setFirewalls(prev => [...prev, newFirewall]);
    if (selectedFirewall !== 'emp') {
      setInventory(prev => ({ ...prev, [selectedFirewall]: prev[selectedFirewall as keyof typeof inventory] - 1 }));
    }

    spawnBurst(canvasRef.current, e.clientX, e.clientY, '#38bdf8');
  };

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;

    const checkCollisions = setInterval(() => {
      setProjectiles(prevProj => {
        let hits = 0;
        const nextProj = prevProj.map(p => {
          const wallIndex = firewalls.findIndex(f => f.lane === p.lane && f.active && Math.abs(p.x - f.x) < 4);
          if (wallIndex !== -1) {
            const wall = firewalls[wallIndex];
            hits++;
            setFirewalls(currentWalls => {
              const updated = [...currentWalls];
              updated[wallIndex] = { ...updated[wallIndex], health: updated[wallIndex].health - 1 };
              if (updated[wallIndex].health <= 0) updated[wallIndex].active = false;
              return updated;
            });
            
            if (wall.type === 'ice') return { ...p, speed: p.speed * 0.4 };
            return null; // Destroy projectile
          }
          return p;
        }).filter(Boolean) as Projectile[];

        if (hits > 0) setCombo(c => c + hits);
        return nextProj;
      });
    }, 100);
    return () => clearInterval(checkCollisions);
  }, [isAttacker, gameState, firewalls]);

  // ===========================================================================
  // ATTACKER — ORBITAL BREACH
  // ===========================================================================
  const [rotation, setRotation] = useState(0);
  const [virusActive, setVirusActive] = useState(false);
  const [virusY, setVirusY] = useState(90); 
  const [attackerScore, setAttackerScore] = useState(0);
  const [attackerLives, setAttackerLives] = useState(3);

  useEffect(() => {
    if (!isAttacker || gameState !== 'playing') return;
    const interval = setInterval(() => setRotation(r => (r + 1.5) % 360), 16);
    return () => clearInterval(interval);
  }, [isAttacker, gameState]);

  const launchVirus = () => {
    if (virusActive || gameState !== 'playing') return;
    setVirusActive(true);
    
    let currentY = 90;
    const vInterval = setInterval(() => {
      currentY -= 2.5;
      setVirusY(currentY);

      if (currentY <= 60 && currentY >= 40) {
        const r = rotation % 360;
        // Two gaps in the shield
        const inGap = (r > 340 || r < 40) || (r > 160 && r < 220);
        if (!inGap) {
          clearInterval(vInterval);
          setVirusActive(false);
          setVirusY(90);
          setAttackerLives(l => {
            if (l <= 1) setGameState('lost');
            return l - 1;
          });
        }
      }

      if (currentY <= 10) {
        clearInterval(vInterval);
        setVirusActive(false);
        setVirusY(90);
        setAttackerScore(s => {
          const next = s + 1;
          if (next >= 3) {
            setGameState('won');
            markLevelComplete('attacker', 1, 300);
          }
          return next;
        });
        setCombo(c => c + 1);
      }
    }, 16);
  };

  return (
    <div className="w-full h-[600px] flex flex-col p-6 bg-[#060609] relative overflow-hidden select-none">
      <GameCanvas color={isAttacker ? '#ef4444' : '#38bdf8'} effects={['ambient', 'grid']} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />

      <GameHUD 
        isAttacker={isAttacker}
        title={isAttacker ? "ORBITAL BREACH" : "FORTRESS PROTOCOL"}
        subtitle={isAttacker ? "Synchronize payload to bypass orbital shields" : "Coordinate firewalls to neutralize inbound threats"}
        stats={[
          { label: isAttacker ? "Lives" : "Integrity", value: isAttacker ? attackerLives : `${hp}%`, color: (isAttacker ? attackerLives < 2 : hp < 30) ? 'text-red-500' : 'text-emerald-400', pulse: (isAttacker ? attackerLives < 2 : hp < 30) },
          { label: "Alert Level", value: wave, color: 'text-amber-500' },
          { label: "Sync", value: isAttacker ? `${attackerScore}/3` : 'STABLE' }
        ]}
        combo={combo}
      />

      <div className="flex-1 relative glass-panel overflow-hidden flex flex-col items-center justify-center">
        
        {isAttacker ? (
          // ATTACKER: High-Fidelity Orbital Breach UI
          <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
             <div className="absolute inset-0 data-stream-bg opacity-10 pointer-events-none" />
             
             {/* Orbital Arena */}
             <div className="relative w-80 h-80 flex items-center justify-center">
                {/* Outer decorative ring */}
                <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse" />
                
                {/* Core Objective */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, -360],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-2xl bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center z-20 shadow-[0_0_40px_rgba(239,68,68,0.2)]"
                >
                   <Server className="w-10 h-10 text-red-500 animate-pulse" />
                   <div className="absolute inset-0 rounded-2xl border border-red-500/10 animate-ping" />
                </motion.div>

                {/* Shield Ring 1 (Static visual) */}
                <div className="absolute w-64 h-64 rounded-full border border-sky-500/10" />

                {/* Active Rotating Shield */}
                <svg 
                  className="absolute w-full h-full z-10"
                  style={{ transform: `rotate(${rotation}deg)` }}
                  viewBox="0 0 200 200"
                >
                   {/* Shield Arc 1 */}
                   <path 
                     d="M 100 20 A 80 80 0 0 1 180 100" 
                     fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" 
                     className="drop-shadow-[0_0_10px_#38bdf8]"
                   />
                   {/* Shield Arc 2 */}
                   <path 
                     d="M 100 180 A 80 80 0 0 1 20 100" 
                     fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" 
                     className="drop-shadow-[0_0_10px_#38bdf8]"
                   />
                </svg>

                {/* Virus Payload */}
                <motion.div 
                  className="absolute w-8 h-12 flex flex-col items-center justify-center z-30"
                  animate={{ top: `${virusY}%` }}
                  style={{ left: '50%', x: '-50%', y: '-50%' }}
                >
                   <div className={`w-8 h-10 bg-red-600 rounded-t-full rounded-b-lg flex items-center justify-center shadow-neon-red transition-opacity ${virusActive ? 'opacity-100' : 'opacity-40'}`}>
                      <Skull className="w-5 h-5 text-white" />
                   </div>
                   <div className="w-1 h-6 bg-gradient-to-b from-red-500 to-transparent animate-pulse" />
                </motion.div>
             </div>

             <div className="flex flex-col items-center gap-6 mt-8">
                <p className="text-[10px] font-display font-bold text-zinc-500 uppercase tracking-[0.5em] animate-pulse">Sync Gaps with Vertical Axis</p>
                <button
                  onClick={launchVirus}
                  disabled={virusActive || gameState !== 'playing'}
                  className={`px-16 py-5 rounded-xl font-display text-sm font-bold uppercase tracking-widest transition-all ${virusActive ? 'bg-zinc-900 text-zinc-700' : 'bg-red-600 text-white hover:bg-red-500 shadow-neon-red hover:scale-105 active:scale-95'}`}
                >
                   Launch Infiltrator
                </button>
             </div>
          </div>
        ) : (
          // DEFENDER: 3D perspective data lanes UI
          <div className="w-full h-full relative perspective-grid p-12 flex flex-col items-center justify-center gap-4">
             <div className="absolute inset-0 perspective-floor opacity-20 pointer-events-none" />
             
             <div className="w-full max-w-5xl h-[350px] relative z-10 flex flex-col justify-between py-8">
                {[0,1,2].map(lane => (
                  <div 
                    key={lane} 
                    onClick={(e) => handleLaneClick(e, lane)}
                    className="relative h-20 w-full group cursor-pointer"
                  >
                     {/* Lane Track */}
                     <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-white/5 rounded-full" />
                     <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-sky-500/10" />
                     
                     {/* Side Rails */}
                     <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                     {/* Server Icon (Left) */}
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shadow-inner-glow group-hover:border-sky-500/50 transition-colors">
                           <Server className="w-6 h-6 text-zinc-600 group-hover:text-sky-400" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-display font-bold text-zinc-500 uppercase tracking-widest">Node_0{lane+1}</span>
                           <span className="text-[8px] font-mono text-zinc-700">STATUS: ACTIVE</span>
                        </div>
                     </div>

                     {/* Projectiles */}
                     {projectiles.filter(p => p.lane === lane).map(p => (
                       <motion.div
                         key={p.id}
                         initial={{ y: '-50%' }}
                         animate={{ y: '-50%' }}
                         className="absolute top-1/2 flex items-center"
                         style={{ left: `${p.x}%` }}
                       >
                          <div className={`w-4 h-4 rounded-full ${p.type === 'heavy' ? 'bg-red-500 shadow-neon-red w-6 h-6' : p.type === 'fast' ? 'bg-amber-400 shadow-neon-amber' : 'bg-sky-500 shadow-neon-blue'}`} />
                          <div className="w-8 h-[2px] bg-gradient-to-l from-white/40 to-transparent" />
                       </motion.div>
                     ))}

                     {/* Firewalls */}
                     {firewalls.filter(f => f.lane === lane && f.active).map(f => (
                       <motion.div
                         key={f.id}
                         initial={{ scale: 0, opacity: 0, y: '-50%' }}
                         animate={{ scale: 1, opacity: 1, y: '-50%' }}
                         className="absolute top-1/2 w-12 h-16 z-30 flex items-center justify-center"
                         style={{ left: `${f.x}%`, x: '-50%' }}
                       >
                          <div className={`w-10 h-14 rounded-xl border-2 flex items-center justify-center shadow-lg ${f.type === 'ice' ? 'bg-sky-500/20 border-sky-400 shadow-neon-blue' : f.type === 'data' ? 'bg-emerald-500/20 border-emerald-400 shadow-neon-green' : 'bg-purple-500/20 border-purple-400 shadow-neon-purple'}`}>
                             {f.type === 'ice' ? <Snowflake className="w-5 h-5 text-sky-400" /> : f.type === 'data' ? <Shield className="w-5 h-5 text-emerald-400" /> : <Zap className="w-5 h-5 text-purple-400" />}
                          </div>
                       </motion.div>
                     ))}
                  </div>
                ))}
             </div>

             {/* Footer Controls */}
             <div className="flex gap-6 p-2 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md z-40">
                {(['ice', 'data', 'emp'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedFirewall(t)}
                    className={`px-8 py-3 rounded-xl border transition-all flex items-center gap-3 ${selectedFirewall === t ? 'bg-sky-500 border-sky-400 shadow-neon-blue text-white' : 'bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10'}`}
                  >
                     {t === 'ice' ? <Snowflake className="w-4 h-4" /> : t === 'data' ? <Shield className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                     <div className="flex flex-col items-start">
                        <span className="text-[10px] font-display font-bold uppercase tracking-wider">{t}</span>
                     <span className="text-[8px] font-mono opacity-60">QTY: {t === 'emp' ? '∞' : inventory[t as keyof typeof inventory]}</span>
                     </div>
                  </button>
                ))}
             </div>
          </div>
        )}

      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {gameState !== 'playing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
               className={`p-10 rounded-2xl border text-center max-w-sm ${gameState === 'won' ? 'border-emerald-500/30 shadow-neon-green' : 'border-red-500/30 shadow-neon-red'}`}
             >
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${gameState === 'won' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                   {gameState === 'won' ? <CheckCircle2 className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
                </div>
                <h2 className="font-display text-3xl font-bold text-white mb-4 uppercase tracking-tighter">
                   {gameState === 'won' ? 'ACCESS GRANTED' : 'SYSTEM LOCKDOWN'}
                </h2>
                <p className="text-zinc-500 text-sm mb-8">
                   {gameState === 'won' ? (isAttacker ? 'Perimeter breached. Infiltration complete.' : 'Firewalls held. Sector integrity 100%.') : (isAttacker ? 'Detection confirmed. Counter-measure active.' : 'Critical failure. Data exfiltration detected.')}
                </p>
                <button onClick={() => setCurrentLevel(null)} className="cyber-btn w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display text-xs font-bold uppercase rounded-xl">Return to Hub</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
