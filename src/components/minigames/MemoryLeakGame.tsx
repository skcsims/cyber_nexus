import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type Role } from '../../store/gameStore';
import { Skull, ShieldCheck, Cpu, RefreshCw, Layers, AlertTriangle, Zap } from 'lucide-react';
import GameHUD from './GameHUD';
import GameCanvas, { spawnBurst } from './GameCanvas';

interface Props {
  role: Role;
}

// =============================================================================
// TYPES
// =============================================================================

interface MemoryBlock {
  id: number;
  type: 'stack' | 'heap' | 'code';
  status: 'clean' | 'leaking' | 'fragmented' | 'overflow';
  size: number;
  offset: string;
}

interface AddressCell {
  id: number;
  hex: string;
  value: string;
  infected: boolean;
  type: 'data' | 'pointer' | 'nop';
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function MemoryLeakGame({ role }: Props) {
  const isAttacker = role === 'attacker';
  const markLevelComplete = useGameStore((s) => s.markLevelComplete);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave] = useState(1);
  const [stability, setStability] = useState(100);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ===========================================================================
  // DEFENDER — RESOURCE RECLAIMER
  // ===========================================================================
  const [blocks, setBlocks] = useState<MemoryBlock[]>([]);
  const MAX_BLOCKS = 12;

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;

    const initialBlocks: MemoryBlock[] = [];
    for (let i = 0; i < MAX_BLOCKS; i++) {
      initialBlocks.push({
        id: i,
        type: i < 4 ? 'stack' : i < 8 ? 'heap' : 'code',
        status: 'clean',
        size: 20 + Math.random() * 30,
        offset: `0x${(i * 1024).toString(16).toUpperCase().padStart(4, '0')}`
      });
    }
    setBlocks(initialBlocks);

    const leakLoop = setInterval(() => {
      setBlocks(prev => {
        const next = [...prev];
        const cleanIndices = next.filter(b => b.status === 'clean').map(b => b.id);
        if (cleanIndices.length === 0) return prev;

        const target = cleanIndices[Math.floor(Math.random() * cleanIndices.length)];
        next[target].status = 'leaking';
        return next;
      });
    }, Math.max(1000, 2000 - wave * 400));

    const stabilityLoop = setInterval(() => {
      setBlocks(prev => {
        const leaking = prev.filter(b => b.status === 'leaking');
        if (leaking.length > 0) {
          setStability(s => {
             const nextS = Math.max(0, s - (leaking.length * 0.5));
             if (nextS <= 0) setGameState('lost');
             return nextS;
          });
          setHp(h => Math.max(0, h - (leaking.length * 0.2)));
        } else {
          setStability(s => Math.min(100, s + 0.3));
        }
        return prev;
      });
    }, 100);

    return () => { clearInterval(leakLoop); clearInterval(stabilityLoop); };
  }, [isAttacker, gameState, wave]);

  const reclaimBlock = (id: number) => {
    if (gameState !== 'playing') return;
    setBlocks(prev => {
      const next = [...prev];
      if (next[id].status === 'leaking') {
        next[id].status = 'clean';
        setScore(s => {
          const nextS = s + 150;
          if (nextS >= 1500) {
            setGameState('won');
            markLevelComplete('defender', 7, 700);
          }
          return nextS;
        });
        setCombo(c => c + 1);
        const canvas = canvasRef.current;
        if (canvas) {
          spawnBurst(canvas, (id % 4) * (canvas.width / 4) + (canvas.width / 8), Math.floor(id / 4) * (canvas.height / 3) + (canvas.height / 6), '#38bdf8');
        }
      }
      return next;
    });
  };

  // ===========================================================================
  // ATTACKER — HEAP OVERFLOW
  // ===========================================================================
  const [addressSpace, setAddressSpace] = useState<AddressCell[]>([]);
  const [overflowProgress, setOverflowProgress] = useState(0);

  useEffect(() => {
    if (!isAttacker || gameState !== 'playing') return;

    const initialSpace: AddressCell[] = [];
    for (let i = 0; i < 24; i++) {
      initialSpace.push({
        id: i,
        hex: `0x${(i * 16).toString(16).toUpperCase().padStart(4, '0')}`,
        value: '00',
        infected: false,
        type: i === 5 ? 'pointer' : i > 5 && i < 10 ? 'nop' : 'data'
      });
    }
    setAddressSpace(initialSpace);

    const scanLoop = setInterval(() => {
      setOverflowProgress(p => {
        const nextP = Math.max(0, p - 0.2);
        return nextP;
      });
    }, 100);

    return () => clearInterval(scanLoop);
  }, [isAttacker, gameState]);

  const injectPayload = (id: number) => {
    if (gameState !== 'playing') return;
    setAddressSpace(prev => {
      const next = [...prev];
      if (!next[id].infected) {
        next[id].infected = true;
        next[id].value = 'FF';
        setOverflowProgress(p => {
          const nextP = p + 10;
          if (nextP >= 100) {
            setGameState('won');
            markLevelComplete('attacker', 7, 700);
          }
          return nextP;
        });
        setScore(s => s + 100);
        setCombo(c => c + 1);
        const canvas = canvasRef.current;
        if (canvas) {
          spawnBurst(canvas, (id % 6) * (canvas.width / 6) + (canvas.width / 12), Math.floor(id / 6) * (canvas.height / 4) + (canvas.height / 8), '#ef4444');
        }
      }
      return next;
    });
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="w-full h-[600px] flex flex-col p-6 bg-[#060609] relative overflow-hidden">
      <GameCanvas color={isAttacker ? '#ef4444' : '#38bdf8'} effects={['ambient', 'grid']} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />

      <GameHUD 
        isAttacker={isAttacker}
        title={isAttacker ? "HEAP OVERFLOW" : "RESOURCE RECLAIMER"}
        subtitle={isAttacker ? "Inject malicious payloads into memory address space" : "Prevent system crash by purging memory leaks"}
        stats={[
          { label: isAttacker ? "Overflow" : "Stability", value: isAttacker ? `${Math.floor(overflowProgress)}%` : `${Math.floor(stability)}%`, color: (isAttacker ? overflowProgress > 70 : stability < 30) ? 'text-red-500' : 'text-emerald-400' },
          { label: isAttacker ? "System HP" : "HP", value: `${hp}%` },
          { label: "Memory", value: isAttacker ? "0x0000" : `${blocks.filter(b => b.status === 'leaking').length} ERR` },
          { label: "Score", value: score }
        ]}
        combo={combo}
      />

      <div className="flex-1 relative glass-panel overflow-hidden flex items-center justify-center">
        
        {isAttacker ? (
          // ATTACKER: Address Space Grid UI
          <div className="w-full h-full p-12 flex flex-col gap-8">
             <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-8 relative overflow-hidden">
                <div className="grid grid-cols-6 gap-3">
                   {addressSpace.map(cell => (
                     <motion.div
                       key={cell.id}
                       onClick={() => injectPayload(cell.id)}
                       className={`h-16 rounded border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                         cell.infected ? 'bg-red-500/20 border-red-500 shadow-neon-red' :
                         cell.type === 'pointer' ? 'border-amber-500/40 bg-amber-500/5' :
                         'border-white/5 bg-white/[0.02] hover:border-white/20'
                       }`}
                       whileHover={{ scale: 1.05 }}
                     >
                        <div className="text-[8px] font-mono text-zinc-600 mb-1">{cell.hex}</div>
                        <div className={`text-sm font-mono font-bold ${cell.infected ? 'text-red-400' : 'text-zinc-400'}`}>{cell.value}</div>
                        {cell.type === 'pointer' && <div className="absolute top-0 right-0 p-1"><Zap className="w-2 h-2 text-amber-500" /></div>}
                     </motion.div>
                   ))}
                </div>
                
                <div className="mt-8 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-red-500" />
                      <div>
                         <div className="text-[10px] font-display font-bold text-white uppercase tracking-widest">Exploit Payload Ready</div>
                         <div className="text-[8px] font-mono text-zinc-500">TARGET_PTR: 0x0050 // SHELLCODE_OFFSET: 0x0080</div>
                      </div>
                   </div>
                   <div className="text-xl font-mono font-bold text-red-400 animate-pulse">{Math.floor(overflowProgress)}%</div>
                </div>
             </div>
          </div>
        ) : (
          // DEFENDER: Memory Blocks UI
          <div className="w-full h-full p-12 flex flex-col gap-8">
             <div className="flex-1 grid grid-cols-4 gap-6 relative">
                {blocks.map(block => (
                  <motion.div
                    key={block.id}
                    onClick={() => reclaimBlock(block.id)}
                    className={`h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all relative overflow-hidden ${
                      block.status === 'leaking' ? 'bg-red-500/10 border-red-500 shadow-neon-red' :
                      'bg-black/60 border-white/10 hover:border-white/30 shadow-inner-glow'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                     <Layers className={`w-6 h-6 ${block.status === 'leaking' ? 'text-red-400' : 'text-zinc-600'}`} />
                     <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{block.type} // {block.offset}</div>
                     <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${block.status === 'leaking' ? 'bg-red-500' : 'bg-emerald-500'}`} 
                          animate={{ width: block.status === 'leaking' ? '100%' : '20%' }} 
                        />
                     </div>
                     {block.status === 'leaking' && (
                       <motion.div 
                         initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                         className="absolute inset-0 bg-red-500/10 flex items-center justify-center"
                       >
                          <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />
                       </motion.div>
                     )}
                  </motion.div>
                ))}
             </div>
             
             <div className="flex justify-center gap-6">
                <button 
                  onClick={() => {}} // Could be a powerup
                  className="px-8 py-3 bg-sky-500/10 border border-sky-500/40 rounded-xl font-display text-[10px] font-bold text-sky-400 uppercase tracking-widest hover:bg-sky-500/20 transition-all flex items-center gap-3"
                >
                   <RefreshCw className="w-4 h-4" /> GC_COLLECTOR_INIT
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
              className={`p-10 rounded-2xl border text-center max-w-md ${gameState === 'won' ? 'border-emerald-500/30 shadow-neon-green' : 'border-red-500/30 shadow-neon-red'}`}
            >
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${gameState === 'won' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                {gameState === 'won' ? <ShieldCheck className="w-8 h-8 text-emerald-400" /> : <Skull className="w-8 h-8 text-red-400" />}
              </div>
              <h2 className={`font-display text-3xl font-bold mb-4 uppercase ${gameState === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
                {gameState === 'won' ? 'MEMORY STABILIZED' : 'STACK OVERFLOW'}
              </h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                {gameState === 'won' 
                  ? (isAttacker ? 'Heap overflow successful. Return-to-libc attack achieved.' : 'Memory leaks purged. Resource integrity confirmed.') 
                  : (isAttacker ? 'Buffer check detected payload. Exploit failed.' : 'System stability reached critical zero. Kernel panic.')}
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
