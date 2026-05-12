import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type Role } from '../../store/gameStore';
import { Lock, Unlock, Skull, FileWarning, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';
import GameHUD from './GameHUD';
import GameCanvas, { spawnBurst } from './GameCanvas';

interface Props {
  role: Role;
}

// =============================================================================
// TYPES
// =============================================================================

interface LockRing {
  id: number;
  radius: number;
  angle: number;
  targetAngle: number;
  speed: number;
  locked: boolean;
  color: string;
}

interface DataBlock {
  id: number;
  status: 'clean' | 'encrypting' | 'encrypted' | 'purged';
  progress: number;
  x: number;
  y: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RansomwareGame({ role }: Props) {
  const isAttacker = role === 'attacker';
  const markLevelComplete = useGameStore((s) => s.markLevelComplete);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ===========================================================================
  // DEFENDER — CRYPTO STABILIZER
  // ===========================================================================
  const [rings, setRings] = useState<LockRing[]>([
    { id: 1, radius: 120, angle: 0, targetAngle: 180, speed: 2, locked: false, color: '#38bdf8' },
    { id: 2, radius: 90, angle: 90, targetAngle: 0, speed: -2.5, locked: false, color: '#818cf8' },
    { id: 3, radius: 60, angle: 180, targetAngle: 270, speed: 3.5, locked: false, color: '#c084fc' },
  ]);

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;

    const animLoop = setInterval(() => {
      setRings(prev => prev.map(r => {
        if (r.locked) return r;
        return { ...r, angle: (r.angle + r.speed + 360) % 360 };
      }));
    }, 16);

    return () => clearInterval(animLoop);
  }, [isAttacker, gameState]);

  const lockRing = (id: number) => {
    if (gameState !== 'playing') return;
    setRings(prev => {
      const next = prev.map(r => {
        if (r.id !== id || r.locked) return r;
        const diff = Math.abs(r.angle - r.targetAngle);
        const isAligned = diff < 15 || diff > 345;
        
        if (isAligned) {
          spawnBurst(canvasRef.current, 400, 300, r.color);
          setScore(s => s + 334);
          return { ...r, locked: true, angle: r.targetAngle };
        } else {
          setHp(h => {
             const nextH = Math.max(0, h - 20);
             if (nextH <= 0) setGameState('lost');
             return nextH;
          });
          return r;
        }
      });

      if (next.every(r => r.locked)) {
        setGameState('won');
        markLevelComplete('defender', 6, 800);
      }
      return next;
    });
  };

  // ===========================================================================
  // ATTACKER — RANSOMWARE DEPLOYER
  // ===========================================================================
  const [blocks, setBlocks] = useState<DataBlock[]>([]);
  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    if (!isAttacker || gameState !== 'playing') return;

    const initialBlocks: DataBlock[] = [];
    for (let i = 0; i < 16; i++) {
      initialBlocks.push({
        id: i,
        status: 'clean',
        progress: 0,
        x: (i % 4) * 100 + 150,
        y: Math.floor(i / 4) * 100 + 150
      });
    }
    setBlocks(initialBlocks);

    const scanLoop = setInterval(() => {
      setScanPos(p => (p + 1) % 16);
    }, 800);

    const encryptLoop = setInterval(() => {
      setBlocks(prev => {
        let caught = false;
        const next = prev.map(b => {
          if (b.status === 'encrypting') {
            const nextP = b.progress + 5;
            if (nextP >= 100) return { ...b, status: 'encrypted' as const, progress: 100 };
            return { ...b, progress: nextP };
          }
          return b;
        });

        // Check if scanner caught an encrypting block
        const scanningBlock = next[scanPos];
        if (scanningBlock.status === 'encrypting') {
          caught = true;
          scanningBlock.status = 'purged' as const;
          scanningBlock.progress = 0;
        }

        if (caught) {
          setHp(h => {
             const nextH = Math.max(0, h - 25);
             if (nextH <= 0) setGameState('lost');
             return nextH;
          });
        }

        if (next.filter(b => b.status === 'encrypted').length >= 10) {
           setGameState('won');
           markLevelComplete('attacker', 6, 800);
        }

        return next;
      });
    }, 200);

    return () => { clearInterval(scanLoop); clearInterval(encryptLoop); };
  }, [isAttacker, gameState, scanPos]);

  const startEncryption = (id: number) => {
    if (gameState !== 'playing') return;
    setBlocks(prev => prev.map(b => {
      if (b.id === id && b.status === 'clean') {
        return { ...b, status: 'encrypting' };
      }
      return b;
    }));
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="w-full h-[600px] flex flex-col p-6 bg-[#060609] relative overflow-hidden">
      <GameCanvas color={isAttacker ? '#ef4444' : '#a855f7'} effects={['ambient', 'scanline']} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />

      <GameHUD 
        isAttacker={isAttacker}
        title={isAttacker ? "RANSOMWARE DEPLOYER" : "CRYPTO STABILIZER"}
        subtitle={isAttacker ? "Encrypt target data blocks while evading security scanners" : "Align cryptographic rings to neutralize encryption locks"}
        stats={[
          { label: isAttacker ? "Stealth" : "Integrity", value: `${hp}%`, color: hp < 30 ? 'text-red-500' : 'text-emerald-400' },
          { label: isAttacker ? "Encrypted" : "Locked", value: isAttacker ? `${blocks.filter(b => b.status === 'encrypted').length}/10` : `${rings.filter(r => r.locked).length}/3` },
          { label: "Score", value: score }
        ]}
        combo={combo}
      />

      <div className="flex-1 relative glass-panel overflow-hidden flex items-center justify-center">
        
        {isAttacker ? (
          // ATTACKER: File Grid UI
          <div className="w-full h-full p-12 flex items-center justify-center">
             <div className="grid grid-cols-4 gap-6">
                {blocks.map(block => (
                  <motion.div
                    key={block.id}
                    onClick={() => startEncryption(block.id)}
                    className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all relative ${
                      block.id === scanPos ? 'border-sky-400 bg-sky-400/10 shadow-neon-blue' :
                      block.status === 'encrypted' ? 'bg-red-500/20 border-red-500 shadow-neon-red' :
                      block.status === 'encrypting' ? 'bg-amber-500/10 border-amber-500' :
                      block.status === 'purged' ? 'bg-zinc-800 border-zinc-700 opacity-50' :
                      'bg-black/60 border-white/10 hover:border-white/30'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                     {block.status === 'encrypted' ? <Lock className="w-6 h-6 text-red-500" /> :
                      block.status === 'encrypting' ? <Activity className="w-6 h-6 text-amber-500 animate-pulse" /> :
                      block.status === 'purged' ? <AlertTriangle className="w-6 h-6 text-zinc-600" /> :
                      <FileWarning className="w-6 h-6 text-zinc-500" />}
                     
                     <div className="text-[7px] font-mono text-zinc-500 uppercase tracking-tighter">BLOCK_{block.id}</div>
                     
                     {block.status === 'encrypting' && (
                       <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
                          <motion.div className="h-full bg-red-500" animate={{ width: `${block.progress}%` }} />
                       </div>
                     )}
                  </motion.div>
                ))}
             </div>
          </div>
        ) : (
          // DEFENDER: Vault Rings UI
          <div className="w-full h-full relative flex items-center justify-center">
             {/* Target Line */}
             <div className="absolute top-1/2 left-1/2 w-1 h-80 bg-emerald-500/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
             <div className="absolute top-[calc(50%-140px)] left-1/2 -translate-x-1/2 text-[8px] font-mono text-emerald-400 uppercase tracking-widest">Target_Align</div>

             <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                {rings.map(ring => (
                  <div 
                    key={ring.id}
                    onClick={() => lockRing(ring.id)}
                    className={`absolute rounded-full border-4 flex items-center justify-center cursor-pointer transition-all ${ring.locked ? 'border-emerald-500 shadow-neon-green' : 'hover:border-white/40'}`}
                    style={{ 
                      width: ring.radius * 2, 
                      height: ring.radius * 2,
                      borderColor: ring.locked ? undefined : ring.color,
                      transform: `rotate(${ring.angle}deg)`,
                      opacity: ring.locked ? 1 : 0.6
                    }}
                  >
                     <div 
                       className={`absolute top-0 w-4 h-4 rounded-full border-2 ${ring.locked ? 'bg-emerald-500 border-white' : 'bg-white border-black'}`}
                       style={{ transform: 'translateY(-50%)' }}
                     />
                  </div>
                ))}

                <motion.div 
                  animate={rings.every(r => r.locked) ? { scale: [1, 1.2, 1] } : {}}
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all ${rings.every(r => r.locked) ? 'bg-emerald-500/20 border-emerald-500 shadow-neon-green' : 'bg-black/60 border-white/10'}`}
                >
                   {rings.every(r => r.locked) ? <Unlock className="w-8 h-8 text-emerald-400" /> : <Lock className="w-8 h-8 text-zinc-600" />}
                </motion.div>
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
                {gameState === 'won' ? 'SYSTEM SECURED' : 'SYSTEM ENCRYPTED'}
              </h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                {gameState === 'won' 
                  ? (isAttacker ? 'Encryption successful. Data vault locked and held for ransom.' : 'Cryptographic stabilization complete. Ransomware neutralized.') 
                  : (isAttacker ? 'Detection confirmed. Encryption sequence terminated by security.' : 'Critical failure. All system data has been encrypted.')}
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
