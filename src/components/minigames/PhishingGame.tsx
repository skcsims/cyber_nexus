import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, type Role } from '../../store/gameStore';
import { Mail, Skull, AlertCircle, CheckCircle2, User } from 'lucide-react';
import GameHUD from './GameHUD';
import GameCanvas, { spawnBurst } from './GameCanvas';

interface Props {
  role: Role;
}

// =============================================================================
// TYPES
// =============================================================================

interface Email {
  id: number;
  lane: number;
  sender: string;
  subject: string;
  isPhishing: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  y: number;
  speed: number;
  active: boolean;
  redFlags: string[];
}

interface TargetProfile {
  id: string;
  name: string;
  role: string;
  vulnerability: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function PhishingGame({ role }: Props) {
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
  // DEFENDER — INBOX SENTINEL
  // ===========================================================================
  const [emails, setEmails] = useState<Email[]>([]);
  const [scanningId, setScanningId] = useState<number | null>(null);
  
  const senders = ["admin@company.com", "ceo@global.net", "hr-support@internal.io", "noreply@bank-auth.com", "security@cloud.svc"];
  const subjects = ["Urgent: Action Required", "Invoice #8273 overdue", "Security Alert: New Login", "Payroll Update Needed", "System Maintenance"];

  useEffect(() => {
    if (isAttacker || gameState !== 'playing') return;

    const spawnLoop = setInterval(() => {
      const lane = Math.floor(Math.random() * 4);
      const isPhishing = Math.random() > 0.6;
      
      // Prevent overlapping by checking if another email is too close at the start
      setEmails(prev => {
        const tooClose = prev.find(e => e.lane === lane && e.y < 15);
        if (tooClose) return prev;

        const newEmail: Email = {
          id: Date.now(),
          lane,
          sender: senders[Math.floor(Math.random() * senders.length)],
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          isPhishing,
          threatLevel: isPhishing ? (Math.random() > 0.8 ? 'critical' : 'high') : 'low',
          y: -15,
          speed: 0.45 + (wave * 0.15),
          active: true,
          redFlags: isPhishing ? ["Suspicious Link", "Grammar Error", "Urgent Tone"] : []
        };
        return [...prev, newEmail];
      });
    }, Math.max(800, 2000 - wave * 400));

    const moveLoop = setInterval(() => {
      setEmails(prev => {
        let damage = 0;
        const next = prev.map(e => ({ ...e, y: e.y + e.speed }))
          .filter(e => {
            if (e.y > 105) {
              if (e.isPhishing) damage += 15;
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
        }
        return next;
      });
    }, 16);

    return () => { clearInterval(spawnLoop); clearInterval(moveLoop); };
  }, [isAttacker, gameState, wave]);

  const handleQuarantine = (email: Email) => {
    if (gameState !== 'playing') return;
    
    setEmails(prev => prev.filter(e => e.id !== email.id));
    spawnBurst(canvasRef.current, (email.lane * 25 + 12.5) * 8, email.y * 6, email.isPhishing ? '#38bdf8' : '#ef4444');

    if (email.isPhishing) {
      setScore(s => s + 100);
      setCombo(c => c + 1);
      if (score + 100 >= 1000) {
        setGameState('won');
        markLevelComplete('defender', 2, 400);
      }
    } else {
      setHp(h => Math.max(0, h - 10));
      setCombo(0);
    }
  };

  // ===========================================================================
  // ATTACKER — PAYLOAD ARCHITECT
  // ===========================================================================
  const [detectionRisk, setDetectionRisk] = useState(20);
  const [authenticity, setAuthenticity] = useState(40);
  const [selectedTarget, setSelectedTarget] = useState<TargetProfile | null>(null);
  const [craftingSteps, setCraftingSteps] = useState<{ label: string, status: 'pending' | 'done', score: number }[]>([
    { label: "Sender Spoof", status: 'pending', score: 0 },
    { label: "Subject Line", status: 'pending', score: 0 },
    { label: "Payload Link", status: 'pending', score: 0 },
    { label: "Visual Theme", status: 'pending', score: 0 },
  ]);

  const targets: TargetProfile[] = [
    { id: 'ceo', name: 'Robert Vance', role: 'CEO', vulnerability: 'Authority Bias' },
    { id: 'admin', name: 'Sarah Chen', role: 'IT Admin', vulnerability: 'Urgency' },
    { id: 'intern', name: 'Alex Smith', role: 'Intern', vulnerability: 'Inexperience' },
  ];

  const craftStep = (idx: number, quality: 'low' | 'med' | 'high') => {
    if (gameState !== 'playing' || !selectedTarget) return;

    setCraftingSteps(prev => {
      const next = [...prev];
      next[idx].status = 'done';
      next[idx].score = quality === 'high' ? 25 : quality === 'med' ? 15 : 5;
      
      const totalScore = next.reduce((acc, s) => acc + s.score, 0);
      setAuthenticity(40 + totalScore / 2);
      setDetectionRisk(20 + (idx * 15) - (totalScore / 4));

      const allDone = next.every(s => s.status === 'done');
      if (allDone) {
        if (totalScore > 60) {
          setGameState('won');
          markLevelComplete('attacker', 2, 400);
        } else {
          setGameState('lost');
          increaseBreach(20);
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
      <GameCanvas color={isAttacker ? '#ef4444' : '#38bdf8'} effects={['ambient', 'scanline']} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />

      <GameHUD 
        isAttacker={isAttacker}
        title={isAttacker ? "PAYLOAD ARCHITECT" : "INBOX SENTINEL"}
        subtitle={isAttacker ? "Craft sophisticated spear-phishing payloads" : "Identify and quarantine malicious data packets"}
        stats={[
          { label: "System Health", value: `${hp}%`, color: hp < 30 ? 'text-red-500' : 'text-white' },
          { label: isAttacker ? "Authenticity" : "Score", value: isAttacker ? `${authenticity}%` : score },
          { label: isAttacker ? "Detection Risk" : "Wave", value: isAttacker ? `${detectionRisk}%` : wave }
        ]}
        combo={combo}
      />

      <div className="flex-1 relative glass-panel overflow-hidden flex">
        
        {isAttacker ? (
          // ATTACKER: Workbench UI
          <div className="flex-1 flex flex-col p-8 gap-8">
            <div className="grid grid-cols-3 gap-6">
               {targets.map(t => (
                 <button
                   key={t.id}
                   onClick={() => setSelectedTarget(t)}
                   className={`p-4 rounded-xl border transition-all text-left group ${selectedTarget?.id === t.id ? 'bg-red-500 border-red-400 shadow-neon-red' : 'bg-black/40 border-white/10'}`}
                 >
                    <User className={`w-6 h-6 mb-2 ${selectedTarget?.id === t.id ? 'text-white' : 'text-zinc-600'}`} />
                    <div className={`text-xs font-display font-bold ${selectedTarget?.id === t.id ? 'text-white' : 'text-zinc-400'}`}>{t.name}</div>
                    <div className="text-[10px] font-mono opacity-60 uppercase">{t.role}</div>
                 </button>
               ))}
            </div>

            {selectedTarget && (
              <div className="flex-1 grid grid-cols-2 gap-8">
                 <div className="flex flex-col gap-4">
                    {craftingSteps.map((step, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-zinc-400">{step.label}</span>
                            {step.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                         </div>
                         <div className="flex gap-2">
                            {(['low', 'med', 'high'] as const).map(q => (
                              <button
                                key={q}
                                disabled={step.status === 'done'}
                                onClick={() => craftStep(idx, q)}
                                className={`flex-1 py-2 rounded-lg text-[9px] font-mono border transition-all ${step.status === 'done' ? 'bg-zinc-900 border-white/5 opacity-50' : 'bg-white/5 border-white/10 hover:border-red-500/50 hover:bg-red-500/5'}`}
                              >
                                {q === 'high' ? 'ADVANCED' : q === 'med' ? 'STANDARD' : 'QUICK'}
                              </button>
                            ))}
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="bg-black/60 rounded-xl border border-white/5 p-6 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Mail className="w-24 h-24" /></div>
                    <h4 className="text-[10px] font-display font-bold text-red-400 uppercase tracking-widest mb-6">Live Payload Preview</h4>
                    <div className="flex-1 font-mono text-[11px] text-zinc-500 space-y-4">
                       <div className="border-b border-white/5 pb-2"><span className="text-white/40">FROM:</span> {craftingSteps[0].status === 'done' ? 'system-admin@internal.net' : '-----------'}</div>
                       <div className="border-b border-white/5 pb-2"><span className="text-white/40">SUBJECT:</span> {craftingSteps[1].status === 'done' ? 'URGENT: SECURITY RESET' : '-----------'}</div>
                       <div className="p-4 bg-white/5 rounded-lg italic">
                          "Hello {selectedTarget.name}, please click the secure link below to verify your login credentials immediately..."
                       </div>
                       <div className="text-red-400/80 underline">{craftingSteps[2].status === 'done' ? 'https://secure-auth.net/verify' : '-----------'}</div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        ) : (
          // DEFENDER: 3D Conveyor UI
          <div className="flex-1 relative perspective-grid">
            <div className="absolute inset-0 perspective-floor opacity-30" />
            
            <div className="absolute inset-0 grid grid-cols-4 px-12">
               {[0,1,2,3].map(lane => (
                 <div key={lane} className="relative border-x border-white/5 h-full">
                    <AnimatePresence>
                       {emails.filter(e => e.lane === lane && e.active).map(email => (
                         <motion.div
                           key={email.id}
                           initial={{ opacity: 0, scale: 0.5, y: -50 }}
                           animate={{ 
                             opacity: 1, 
                             scale: scanningId === email.id ? 1.05 : 1, 
                             y: `${email.y}%`,
                             zIndex: scanningId === email.id ? 50 : 10
                           }}
                           exit={{ opacity: 0, scale: 1.2 }}
                           className="absolute left-1/2 -translate-x-1/2 w-40 cursor-pointer"
                           onMouseEnter={() => setScanningId(email.id)}
                           onMouseLeave={() => setScanningId(null)}
                           onClick={() => handleQuarantine(email)}
                         >
                            <div className={`p-3 bg-black/90 border rounded-xl transition-colors shadow-2xl relative overflow-hidden ${scanningId === email.id ? 'border-sky-500/50 bg-sky-950/20' : 'border-white/10'}`}>
                               <div className="flex items-center gap-2 mb-2">
                                  <div className={`p-1.5 rounded-lg ${email.isPhishing ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                                     {email.isPhishing ? <AlertCircle className="w-3 h-3 text-red-400" /> : <Mail className="w-3 h-3 text-emerald-400" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <div className="text-[8px] font-mono text-zinc-500 truncate">{email.sender}</div>
                                     <div className="text-[9px] font-display font-bold text-white truncate leading-tight">{email.subject}</div>
                                  </div>
                               </div>

                               <AnimatePresence>
                                 {scanningId === email.id && (
                                   <motion.div 
                                     initial={{ height: 0, opacity: 0 }} 
                                     animate={{ height: 'auto', opacity: 1 }}
                                     exit={{ height: 0, opacity: 0 }}
                                     className="pt-2 border-t border-white/5 space-y-1.5 overflow-hidden"
                                   >
                                      <div className="flex justify-between items-center">
                                         <span className="text-[7px] font-mono text-zinc-500 uppercase">Risk Level</span>
                                         <span className={`text-[7px] font-bold uppercase ${email.threatLevel === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>{email.threatLevel}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                         {email.redFlags.map((flag, i) => (
                                           <span key={i} className="px-1 py-0.5 bg-red-500/10 text-red-400 text-[6px] font-mono uppercase rounded border border-red-500/20">{flag}</span>
                                         ))}
                                      </div>
                                   </motion.div>
                                 )}
                               </AnimatePresence>
                            </div>
                         </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
               ))}
            </div>

            {/* Scanner Beam */}
            <div className="absolute bottom-[20%] w-full h-px bg-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.5)] z-40 flex items-center justify-center">
               <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded text-[8px] font-display text-sky-400 uppercase tracking-[0.3em] backdrop-blur-sm">Threat Sweep Active</div>
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
                {gameState === 'won' ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <Skull className="w-8 h-8 text-red-400" />}
              </div>
              <h2 className={`font-display text-3xl font-bold mb-4 uppercase ${gameState === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
                {gameState === 'won' ? 'AUTHENTICATION SUCCESS' : 'SYSTEM COMPROMISED'}
              </h2>
              <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
                {gameState === 'won' 
                  ? (isAttacker ? 'Phishing campaign successful. Admin privileges obtained.' : 'Inbound threats neutralized. Employee awareness at peak.') 
                  : (isAttacker ? 'Payload detected by sentinel scanner. Connection severed.' : 'Spear-phishing breach successful. Core data leaked.')}
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
