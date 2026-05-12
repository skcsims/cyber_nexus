import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Terminal, X, ChevronRight, Cpu, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export default function DialogueSystem() {
  const activeDialogue = useGameStore((state) => state.activeDialogue);
  const setDialogue = useGameStore((state) => state.setDialogue);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!activeDialogue) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let index = 0;
    const text = activeDialogue.text;
    
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (prev.length < text.length) {
          return text.slice(0, prev.length + 1);
        }
        clearInterval(interval);
        setIsTyping(false);
        return prev;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [activeDialogue]);

  if (!activeDialogue) return null;

  const isOracle = activeDialogue.npc === 'ORACLE';
  const isVoid = activeDialogue.npc === 'VOID';

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-[100] pointer-events-none flex items-end justify-center p-8 md:p-12">
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl glass-panel-elevated p-1 md:p-1.5 relative pointer-events-auto corner-brackets"
        >
          <div className="bg-black/80 rounded-xl overflow-hidden flex flex-col md:flex-row gap-0 md:gap-6 p-4 md:p-6 border border-white/5">
            
            {/* NPC Portrait Area */}
            <div className="flex-shrink-0 flex flex-row md:flex-col items-center gap-4 mb-4 md:mb-0">
              <div className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl border flex items-center justify-center relative overflow-hidden ${
                isOracle ? 'border-sky-500/30 bg-sky-500/10 shadow-neon-blue' : 
                isVoid ? 'border-red-500/30 bg-red-500/10 shadow-neon-red' : 
                'border-emerald-500/30 bg-emerald-500/10'
              }`}>
                {isOracle ? <Cpu className="w-8 h-8 md:w-12 md:h-12 text-sky-400" /> : 
                 isVoid ? <ShieldAlert className="w-8 h-8 md:w-12 md:h-12 text-red-400" /> : 
                 <User className="w-8 h-8 md:w-12 md:h-12 text-emerald-400" />}
                
                {/* Scanline effect in portrait */}
                <div className="absolute inset-0 scanline opacity-30" />
              </div>
              <div className="flex flex-col md:items-center">
                <span className={`font-display font-black text-[10px] md:text-xs tracking-[0.3em] uppercase ${
                  isOracle ? 'text-sky-400' : isVoid ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {activeDialogue.npc}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Authorized</span>
              </div>
            </div>

            {/* Dialogue Content */}
            <div className="flex-1 flex flex-col pt-1">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-3 h-3 text-zinc-500" />
                <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">Session_ID: {activeDialogue.id}</span>
              </div>
              
              <div className="flex-1 min-h-[60px] md:min-h-[80px]">
                <p className="text-zinc-200 font-mono text-sm md:text-base leading-relaxed tracking-tight">
                  {displayedText}
                  {isTyping && <span className="inline-block w-2 h-4 bg-[var(--cyber-primary)] ml-1 animate-pulse" />}
                </p>
              </div>

              <div className="mt-4 flex justify-end items-center gap-4">
                {!isTyping && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setDialogue(null)}
                    className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-display text-[10px] font-bold uppercase tracking-[0.2em] transition-all group"
                  >
                    Continue <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                )}
                <button 
                  onClick={() => setDialogue(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-600 hover:text-zinc-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
