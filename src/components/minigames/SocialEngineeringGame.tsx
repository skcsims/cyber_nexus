import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type Role } from '../../store/gameStore';
import { User, Fingerprint, AlertTriangle, ShieldCheck, ChevronRight, X, Search, Database, MessageSquare, Zap } from 'lucide-react';
import GameHUD from './GameHUD';
import GameCanvas, { spawnBurst } from './GameCanvas';

interface Props {
  role: Role;
}

// =============================================================================
// TYPES
// =============================================================================

interface IDCard {
  id: number;
  name: string;
  role: string;
  department: string;
  expiry: string;
  hologramValid: boolean;
  photoMatch: boolean;
  barcodeValid: boolean;
  risk: 'low' | 'med' | 'high';
  avatar: string;
}

interface DialogueNode {
  id: string;
  text: string;
  options: {
    text: string;
    tone: 'professional' | 'urgent' | 'friendly' | 'aggressive';
    suspicionMod: number;
    nextId: string | 'win' | 'lose';
  }[];
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function SocialEngineeringGame({ role }: Props) {
  const isAttacker = role === 'attacker';
  const markLevelComplete = useGameStore((s) => s.markLevelComplete);
  const increaseBreach = useGameStore((s) => s.increaseBreach);
  const setCurrentLevel = useGameStore((s) => s.setCurrentLevel);

  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [suspicion, setSuspicion] = useState(20);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ===========================================================================
  // DEFENDER — ACCESS CONTROL
  // ===========================================================================
  const [currentCard, setCurrentCard] = useState<IDCard | null>(null);
  const [queueCount, setQueueCount] = useState(5);

  const generateCard = (): IDCard => {
    const names = ["Dr. Aris Thorne", "Sarah Jenkins", "Marcus Vane", "Elena Kross"];
    const roles = ["Senior Researcher", "Maintenance", "HR Liaison", "Core Architect"];
    const isValid = Math.random() > 0.5;
    
    return {
      id: Date.now(),
      name: names[Math.floor(Math.random() * names.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      department: "Sector 7G",
      expiry: isValid ? "2026-12" : "2023-01",
      hologramValid: isValid ? true : Math.random() > 0.5,
      photoMatch: isValid ? true : Math.random() > 0.5,
      barcodeValid: isValid ? true : Math.random() > 0.5,
      risk: (isValid ? 'low' : 'high') as 'low' | 'med' | 'high',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
    };
  };

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;
    setCurrentCard(generateCard());
  }, [isAttacker, gameState]);

  const handleDecision = (allow: boolean) => {
    if (!currentCard) return;

    const isValid = currentCard.hologramValid && currentCard.photoMatch && currentCard.barcodeValid && currentCard.expiry === "2026-12";
    const correct = allow === isValid;

    if (correct) {
      setScore(s => s + 200);
      setCombo(c => c + 1);
      spawnBurst(canvasRef.current, 400, 300, '#38bdf8');
      if (score + 200 >= 1000) {
        setGameState('won');
        markLevelComplete('defender', 6, 600);
      }
    } else {
      setHp(h => {
        const nextH = Math.max(0, h - 25);
        if (nextH <= 0) setGameState('lost');
        return nextH;
      });
      setCombo(0);
    }

    setQueueCount(q => q - 1);
    setCurrentCard(generateCard());
  };

  // ===========================================================================
  // ATTACKER — SOCIAL ARCHITECT
  // ===========================================================================
  const [dialogueId, setDialogueId] = useState('start');
  const dialogueTree: Record<string, DialogueNode> = {
    start: {
      id: 'start',
      text: "The security guard looks up from his terminal. 'ID please. What's your business in the server room?'",
      options: [
        { text: "I'm with maintenance. Got a ticket for the AC unit.", tone: 'professional', suspicionMod: -5, nextId: 'branch1' },
        { text: "Do you know who I am? I'm late for the board meeting!", tone: 'aggressive', suspicionMod: 15, nextId: 'branch2' },
        { text: "Hey buddy, just forgot my badge at my desk. Mind letting me through?", tone: 'friendly', suspicionMod: 5, nextId: 'branch1' },
      ]
    },
    branch1: {
      id: 'branch1',
      text: "'Maintenance, huh? I didn't see any ticket on the schedule for today.' He reaches for the phone.",
      options: [
        { text: "Must be the new system lag. Check under 'Emergency Patch'.", tone: 'urgent', suspicionMod: -10, nextId: 'win' },
        { text: "Oh, maybe I'm on the wrong floor? My bad.", tone: 'friendly', suspicionMod: 20, nextId: 'lose' },
      ]
    },
    branch2: {
      id: 'branch2',
      text: "'The board meeting is in Sector A, sir. This is Sector G.' He narrows his eyes.",
      options: [
        { text: "G is the shortcut! Everyone knows that.", tone: 'aggressive', suspicionMod: 30, nextId: 'lose' },
        { text: "Ah, I must have taken the wrong elevator. New layout is confusing.", tone: 'friendly', suspicionMod: 5, nextId: 'branch1' },
      ]
    }
  };

  const handleDialogueChoice = (opt: DialogueNode['options'][0]) => {
    setSuspicion(s => {
      const nextS = Math.min(100, Math.max(0, s + opt.suspicionMod));
      if (nextS >= 100) {
         setGameState('lost');
         increaseBreach(25);
      }
      return nextS;
    });

    if (opt.nextId === 'win') {
      setGameState('won');
      markLevelComplete('attacker', 6, 600);
    } else if (opt.nextId === 'lose') {
      setGameState('lost');
    } else {
      setDialogueId(opt.nextId);
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="w-full h-[600px] flex flex-col p-6 bg-[#060609] relative overflow-hidden">
      <GameCanvas color={isAttacker ? '#ef4444' : '#38bdf8'} effects={['ambient', 'scanline']} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />

      <GameHUD 
        isAttacker={isAttacker}
        title={isAttacker ? "SOCIAL ARCHITECT" : "ACCESS CONTROL"}
        subtitle={isAttacker ? "Manipulate human variables to bypass physical security" : "Verify biometric and digital credentials at the checkpoint"}
        stats={[
          { label: isAttacker ? "Suspicion" : "Integrity", value: isAttacker ? `${Math.floor(suspicion)}%` : `${hp}%`, color: (isAttacker ? suspicion > 70 : hp < 30) ? 'text-red-500' : 'text-emerald-400' },
          { label: isAttacker ? "Phase" : "Queue", value: isAttacker ? dialogueId.toUpperCase() : queueCount },
          { label: "Score", value: score }
        ]}
        combo={combo}
      />

      <div className="flex-1 relative glass-panel overflow-hidden flex items-center justify-center">
        
        {isAttacker ? (
          // ATTACKER: Dialogue UI
          <div className="w-full h-full p-12 flex flex-col gap-8">
             <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 p-4 opacity-10"><MessageSquare className="w-32 h-32" /></div>
                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                   <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                      <User className="w-6 h-6 text-red-400" />
                   </div>
                   <div>
                      <div className="text-[10px] font-mono text-zinc-500 uppercase">Target: Security Guard</div>
                      <div className="text-xs font-display font-bold text-white uppercase tracking-widest">Nexus Perimeter Guard</div>
                   </div>
                </div>

                <div className="flex-1 font-mono text-sm text-zinc-300 leading-relaxed italic mb-8">
                   {`> "${dialogueTree[dialogueId].text}"`}
                </div>

                <div className="grid grid-cols-1 gap-3">
                   {dialogueTree[dialogueId].options.map((opt, i) => (
                     <button
                       key={i}
                       onClick={() => handleDialogueChoice(opt)}
                       className="group w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 hover:border-red-500/40 transition-all text-left flex items-center gap-4"
                     >
                        <div className="w-8 h-8 rounded bg-black/40 border border-white/10 flex items-center justify-center text-[10px] font-mono text-zinc-500 group-hover:text-red-400">
                           {i + 1}
                        </div>
                        <div className="flex-1">
                           <div className="text-[9px] font-mono text-zinc-500 uppercase mb-0.5">[{opt.tone}]</div>
                           <div className="text-xs font-display font-bold text-zinc-300 group-hover:text-white">{opt.text}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-red-400 transition-all" />
                     </button>
                   ))}
                </div>
             </div>
          </div>
        ) : (
          // DEFENDER: ID Inspection UI
          <div className="w-full h-full p-12 flex gap-8">
             {/* Left: Camera Feed */}
             <div className="w-1/3 flex flex-col gap-4">
                <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">
                   <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-500/20 px-2 py-0.5 rounded border border-red-500/40 z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] font-mono text-red-400 uppercase font-bold tracking-widest">LIVE_FEED</span>
                   </div>
                   <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
                      {currentCard && <img src={currentCard.avatar} className="w-48 h-48 opacity-80" alt="Avatar" />}
                   </div>
                   <div className="p-4 bg-black/40 border-t border-white/5">
                      <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Face Match</div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div className="h-full bg-sky-500" animate={{ width: currentCard?.photoMatch ? '100%' : '40%' }} />
                      </div>
                   </div>
                </div>
                <div className="bg-black/60 rounded-xl border border-white/5 p-4 flex items-center justify-center gap-4">
                   <Database className="w-5 h-5 text-zinc-600" />
                   <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">System Database Linked</span>
                </div>
             </div>

             {/* Right: ID Card Details */}
             <div className="flex-1 flex flex-col gap-6">
                <AnimatePresence mode="wait">
                   {currentCard && (
                     <motion.div 
                       key={currentCard.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="flex-1 bg-[#0a0a0f] border border-white/10 rounded-2xl p-8 relative shadow-2xl glass-panel-elevated overflow-hidden"
                     >
                        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                           <div>
                              <div className="text-[10px] font-display font-black text-sky-400 tracking-[0.2em] uppercase">Nexus Security Credential</div>
                              <div className="text-[8px] font-mono text-zinc-600 uppercase mt-1">Authorized Access Personnel Only</div>
                           </div>
                           <Fingerprint className="w-6 h-6 text-sky-500/50" />
                        </div>

                        <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Full Name</div>
                                 <div className="text-sm font-display font-bold text-white">{currentCard.name}</div>
                              </div>
                              <div className="space-y-1">
                                 <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Role</div>
                                 <div className="text-sm font-display font-bold text-sky-400">{currentCard.role}</div>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Department</div>
                                 <div className="text-sm font-display font-bold text-white">{currentCard.department}</div>
                              </div>
                              <div className="space-y-1">
                                 <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Expiry Date</div>
                                 <div className={`text-sm font-display font-bold ${currentCard.expiry === "2026-12" ? 'text-emerald-400' : 'text-red-400'}`}>{currentCard.expiry}</div>
                              </div>
                           </div>
                        </div>

                        <div className="mt-12 flex justify-between items-end">
                           <div className="flex gap-4">
                              <div className={`p-2 rounded border transition-all ${currentCard.hologramValid ? 'border-sky-500/20 bg-sky-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                 <Zap className={`w-4 h-4 ${currentCard.hologramValid ? 'text-sky-400' : 'text-red-400 opacity-50'}`} />
                              </div>
                              <div className={`p-2 rounded border transition-all ${currentCard.barcodeValid ? 'border-sky-500/20 bg-sky-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                 <Search className={`w-4 h-4 ${currentCard.barcodeValid ? 'text-sky-400' : 'text-red-400 opacity-50'}`} />
                              </div>
                           </div>
                           <div className="text-[10px] font-mono text-zinc-700">#{(currentCard.id % 10000).toString(16).toUpperCase()}</div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent pointer-events-none" />
                     </motion.div>
                   )}
                </AnimatePresence>

                <div className="flex gap-4">
                   <button onClick={() => handleDecision(false)} className="flex-1 py-4 bg-red-500/10 border border-red-500/40 rounded-xl font-display text-[10px] font-bold text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                      <X className="w-4 h-4" /> DENY_ACCESS
                   </button>
                   <button onClick={() => handleDecision(true)} className="flex-1 py-4 bg-sky-500/10 border border-sky-500/40 rounded-xl font-display text-[10px] font-bold text-sky-400 uppercase tracking-widest hover:bg-sky-500/20 transition-all flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> GRANT_ACCESS
                   </button>
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
                {gameState === 'won' ? <ShieldCheck className="w-8 h-8 text-emerald-400" /> : <AlertTriangle className="w-8 h-8 text-red-400" />}
              </div>
              <h2 className={`font-display text-3xl font-bold mb-4 uppercase ${gameState === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
                {gameState === 'won' ? 'IDENTITY VERIFIED' : 'COVER BLOWN'}
              </h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                {gameState === 'won' 
                  ? (isAttacker ? 'Social engineering successful. Security perimeter bypassed.' : 'Checkpoint secure. All personnel verified.') 
                  : (isAttacker ? 'Suspicion limit reached. Detained for questioning.' : 'Unauthorized entry confirmed. Perimeter breach.')}
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
