import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type Role } from '../../store/gameStore';
import { Lock, Unlock } from 'lucide-react';
import GameHUD from './GameHUD';
import GameCanvas, { spawnBurst } from './GameCanvas';

interface Props {
  role: Role;
}

// =============================================================================
// TYPES
// =============================================================================

interface HexCell {
  id: number;
  row: number;
  col: number;
  status: 'clean' | 'corrupted' | 'stabilized' | 'frozen';
  value: string;
  intensity: number;
}

interface LockState {
  id: number;
  targetFreq: number;
  targetAmp: number;
  cracked: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function PasswordGame({ role }: Props) {
  const isAttacker = role === 'attacker';
  const markLevelComplete = useGameStore((s) => s.markLevelComplete);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave] = useState(1);
  const [powerUp, setPowerUp] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ===========================================================================
  // DEFENDER — MATRIX GUARDIAN
  // ===========================================================================
  const [grid, setGrid] = useState<HexCell[]>([]);
  const [frozen, setFrozen] = useState(false);
  const COLS = 8;
  const ROWS = 6;

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;

    // Initialize grid
    const initialGrid: HexCell[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        initialGrid.push({
          id: r * COLS + c,
          row: r,
          col: c,
          status: 'clean',
          value: Math.floor(Math.random() * 16).toString(16).toUpperCase(),
          intensity: 0
        });
      }
    }
    setGrid(initialGrid);

    // Corruption logic
    const interval = setInterval(() => {
      if (frozen) return;

      setGrid(prev => {
        const next = [...prev];
        const corruptedIndices = next.filter(cell => cell.status === 'corrupted').map(cell => cell.id);
        
        // Spawn new corruption if none
        if (corruptedIndices.length === 0) {
          const randIdx = Math.floor(Math.random() * next.length);
          next[randIdx].status = 'corrupted';
          return next;
        }

        // Spread corruption
        const newNext = [...next];
        let newCorrupted = 0;
        corruptedIndices.forEach(idx => {
          const cell = next[idx];
          const neighbors = [
            { r: cell.row, c: cell.col - 1 },
            { r: cell.row, c: cell.col + 1 },
            { r: cell.row - 1, c: cell.col },
            { r: cell.row + 1, c: cell.col },
          ].filter(n => n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS);

          neighbors.forEach(n => {
            const nIdx = n.r * COLS + n.c;
            if (newNext[nIdx].status === 'clean' && Math.random() > 0.95) {
              newNext[nIdx].status = 'corrupted';
              newCorrupted++;
            }
          });
        });

        const totalCorrupted = newNext.filter(c => c.status === 'corrupted').length;
        if (totalCorrupted > (ROWS * COLS) * 0.7) {
          setHp(h => {
             const nextH = Math.max(0, h - 5);
             if (nextH <= 0) setGameState('lost');
             return nextH;
          });
        }

        return newNext;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAttacker, gameState, frozen]);

  const stabilizeCell = (id: number) => {
    if (gameState !== 'playing') return;
    setGrid(prev => {
      const next = [...prev];
      if (next[id].status === 'corrupted') {
        next[id].status = 'stabilized';
        setScore(s => {
          const nextS = s + 50;
          if (nextS >= 2000) {
            setGameState('won');
            markLevelComplete('defender', 3, 500);
          }
          return nextS;
        });
        setCombo(c => c + 1);
        spawnBurst(canvasRef.current, (id % COLS) * 100 + 100, Math.floor(id / COLS) * 80 + 100, '#38bdf8');
      }
      return next;
    });
  };

  const useFreeze = () => {
    if (powerUp !== 'FREEZE' || frozen) return;
    setFrozen(true);
    setPowerUp(null);
    setTimeout(() => setFrozen(false), 5000);
  };

  // ===========================================================================
  // ATTACKER — FREQUENCY CRACKER
  // ===========================================================================
  const [locks, setLocks] = useState<LockState[]>([
    { id: 1, targetFreq: 5, targetAmp: 60, cracked: false },
    { id: 2, targetFreq: 8, targetAmp: 40, cracked: false },
    { id: 3, targetFreq: 3, targetAmp: 80, cracked: false },
  ]);
  const [activeLock, setActiveLock] = useState(0);
  const [userFreq, setUserFreq] = useState(1);
  const [userAmp, setUserAmp] = useState(20);
  const [precision, setPrecision] = useState(0);

  useEffect(() => {
    if (!isAttacker || gameState !== 'playing') return;

    const interval = setInterval(() => {
      const lock = locks[activeLock];
      const freqDiff = Math.abs(userFreq - lock.targetFreq);
      const ampDiff = Math.abs(userAmp - lock.targetAmp);
      
      const currentPrecision = Math.max(0, 100 - (freqDiff * 20 + ampDiff / 2));
      setPrecision(currentPrecision);

      if (currentPrecision > 95) {
        setLocks(prev => {
          const next = [...prev];
          next[activeLock].cracked = true;
          if (activeLock < locks.length - 1) {
            setActiveLock(l => l + 1);
            setCombo(c => c + 1);
            setScore(s => s + 500);
          } else {
            setGameState('won');
            markLevelComplete('attacker', 3, 500);
          }
          return next;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isAttacker, gameState, activeLock, userFreq, userAmp, locks, markLevelComplete]);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="w-full h-[600px] flex flex-col p-6 bg-[#060609] relative overflow-hidden">
      <GameCanvas color={isAttacker ? '#ef4444' : '#38bdf8'} effects={['ambient', 'grid']} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />

      <GameHUD 
        isAttacker={isAttacker}
        title={isAttacker ? "FREQUENCY CRACKER" : "MATRIX GUARDIAN"}
        subtitle={isAttacker ? "Match signal harmonics to bypass vault" : "Stabilize corrupted data fragments"}
        stats={[
          { label: isAttacker ? "Precision" : "Integrity", value: isAttacker ? `${Math.floor(precision)}%` : `${hp}%`, color: (isAttacker ? precision > 80 : hp > 80) ? 'text-emerald-400' : 'text-red-400' },
          { label: "Target", value: isAttacker ? `LOCK ${activeLock + 1}` : `WAVE ${wave}` },
          { label: "Score", value: score }
        ]}
        combo={combo}
      />

      <div className="flex-1 relative glass-panel overflow-hidden flex items-center justify-center">
        
        {isAttacker ? (
          // ATTACKER: Oscilloscope UI
          <div className="w-full h-full flex flex-col p-8 gap-8">
            <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">
               <div className="absolute inset-0 grid-pulse opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(239,68,68,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
               
               {/* Waveform Canvas (SVG) */}
               <svg className="flex-1 w-full h-full">
                  {/* Target Wave */}
                  <motion.path 
                    d={`M 0 150 ${Array.from({ length: 40 }).map((_, i) => {
                      const x = i * 25;
                      const y = 150 + Math.sin(x * locks[activeLock].targetFreq / 50 + Date.now()/200) * locks[activeLock].targetAmp;
                      return `L ${x} ${y}`;
                    }).join(' ')}`}
                    fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5,5" opacity="0.3"
                  />
                  {/* User Wave */}
                  <motion.path 
                    d={`M 0 150 ${Array.from({ length: 40 }).map((_, i) => {
                      const x = i * 25;
                      const y = 150 + Math.sin(x * userFreq / 50 + Date.now()/200) * userAmp;
                      return `L ${x} ${y}`;
                    }).join(' ')}`}
                    fill="none" stroke="#ef4444" strokeWidth="3" className="glow-pulse-red"
                  />
               </svg>

               <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center">
                  <div className="flex gap-2">
                     {locks.map(l => (
                       <div key={l.id} className={`w-8 h-8 rounded border flex items-center justify-center ${l.cracked ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : activeLock === l.id-1 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-white/5 border-white/10 text-zinc-600'}`}>
                          {l.cracked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                       </div>
                     ))}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Signal Interference: <span className="text-red-400">12%</span></div>
               </div>
            </div>

            <div className="flex gap-8">
               <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-[10px] font-display font-bold text-zinc-400 uppercase">Frequency <span className="text-white">{userFreq.toFixed(1)} GHz</span></div>
                  <input type="range" min="1" max="10" step="0.1" value={userFreq} onChange={(e) => setUserFreq(parseFloat(e.target.value))} className="w-full accent-red-500" />
               </div>
               <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-[10px] font-display font-bold text-zinc-400 uppercase">Amplitude <span className="text-white">{userAmp} MV</span></div>
                  <input type="range" min="10" max="100" step="1" value={userAmp} onChange={(e) => setUserAmp(parseInt(e.target.value))} className="w-full accent-red-500" />
               </div>
            </div>
          </div>
        ) : (
          // DEFENDER: Hex Grid UI
          <div className="w-full h-full flex flex-col p-4 gap-4">
             <div className="flex-1 grid grid-cols-[1fr_200px] gap-4 overflow-hidden">
                
                {/* Main Matrix Area */}
                <div className="bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center p-3 relative">
                   <div className="absolute inset-0 grid-pulse opacity-5 pointer-events-none" />
                   <div className="grid grid-cols-8 gap-1.5 relative z-10">
                      {grid.map(cell => (
                        <motion.div
                          key={cell.id}
                          onClick={() => stabilizeCell(cell.id)}
                          className="w-12 h-14 relative cursor-pointer group"
                          whileHover={{ scale: 1.1 }}
                        >
                           <div 
                             className={`absolute inset-0 bg-black border-2 transition-all duration-300 ${
                               cell.status === 'corrupted' ? 'border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse' :
                               cell.status === 'stabilized' ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' :
                               'border-white/10 bg-white/[0.02] hover:border-sky-500/50 hover:bg-sky-500/5'
                             }`}
                             style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                           >
                              <div className={`absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold transition-all ${cell.status === 'corrupted' ? 'text-red-400' : cell.status === 'stabilized' ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                 {cell.status === 'corrupted' ? 'ERR' : cell.value}
                              </div>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                </div>

                {/* Tactical Sidebar */}
                <div className="bg-black/40 rounded-2xl border border-white/5 p-4 flex flex-col gap-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-5"><Unlock className="w-16 h-16" /></div>
                   
                   <div className="space-y-3">
                      <div className="text-[9px] font-display font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        Integrity
                      </div>
                      <div className="space-y-1">
                         {Array.from({ length: 12 }).reverse().map((_, i) => {
                           const isActive = i < Math.floor((score / 2000) * 12);
                           return (
                             <div 
                               key={i} 
                               className={`h-2.5 w-full rounded-sm border transition-all duration-500 ${isActive ? 'bg-sky-500/40 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.3)]' : 'bg-black/60 border-white/5'}`}
                             />
                           );
                         })}
                      </div>
                   </div>

                   <div className="mt-auto space-y-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                         <div className="text-[8px] font-mono text-zinc-500 uppercase mb-0.5">Status</div>
                         <div className={`text-[10px] font-display font-bold uppercase truncate ${hp < 40 ? 'text-red-500' : 'text-emerald-400'}`}>
                            {hp < 40 ? 'CRITICAL' : 'STABLE'}
                         </div>
                      </div>

                      <button 
                        onClick={useFreeze}
                        disabled={powerUp !== 'FREEZE'}
                        className={`w-full py-3 rounded-xl border font-display text-[9px] font-bold uppercase tracking-widest transition-all ${powerUp === 'FREEZE' ? 'bg-sky-500 border-sky-400 text-white shadow-neon-blue animate-pulse' : 'bg-white/5 border-white/10 text-zinc-600'}`}
                      >
                         EMP Stabilizer
                      </button>
                   </div>
                </div>
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
                {gameState === 'won' ? <Unlock className="w-8 h-8 text-emerald-400" /> : <Lock className="w-8 h-8 text-red-400" />}
              </div>
              <h2 className={`font-display text-3xl font-bold mb-4 uppercase ${gameState === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
                {gameState === 'won' ? 'ACCESS GRANTED' : 'SYSTEM LOCKOUT'}
              </h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                {gameState === 'won' 
                  ? (isAttacker ? 'Encryption harmonics matched. Security vault breached.' : 'Data matrix stabilized. All corruption purged.') 
                  : (isAttacker ? 'Signal trace detected. Terminal connection severed.' : 'Matrix collapse. Security perimeter failed.')}
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
