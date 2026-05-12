import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import PhaserGame from './PhaserGame';
import MinigameModal from './MinigameModal';
import MissionBriefing from './MissionBriefing';
import StatsModal from './StatsModal';
import { ArrowLeftRight, Coins, AlertTriangle, Radio, Trophy } from 'lucide-react';

export default function GameHub() {
  const role = useGameStore((state) => state.role);
  const setRole = useGameStore((state) => state.setRole);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const missionState = useGameStore((state) => state.missionState);
  const cyberCredits = useGameStore((state) => state.cyberCredits);
  const breachMeter = useGameStore((state) => state.breachMeter);
  const campaignComplete = useGameStore((state) => state.campaignComplete);
  const [showStats, setShowStats] = useState(false);
  
  const isAttacker = role === 'attacker';

  return (
    <div className={`h-screen w-full relative flex flex-col overflow-hidden theme-cyber ${isAttacker ? 'role-attacker' : 'role-defender'}`}>
      
      {/* Top HUD */}
      <div className="glass-panel m-3 md:m-4 p-3 md:p-4 flex justify-between items-center z-10 sticky top-3 md:top-4 relative noise-overlay">
        {/* Top accent */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[var(--cyber-primary)]/30 to-transparent" />
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setShowStats(true)}
            className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center group hover:border-[var(--cyber-primary)]/40 hover:bg-[var(--cyber-primary)]/10 transition-all duration-300 shadow-lg relative"
            title="Stats & Leaderboard"
          >
            <Trophy className="w-4 h-4 md:w-5 md:h-5 text-zinc-400 group-hover:text-[var(--cyber-primary)] transition-colors" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--cyber-primary)] rounded-full animate-pulse shadow-neon-blue opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="flex items-center gap-3 md:gap-5">
          {/* Status indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
            <Radio className="w-3 h-3 text-[var(--cyber-primary)] animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-500">LIVE</span>
          </div>
          
          {/* Credits */}
          <div className="px-4 py-2.5 bg-black/50 rounded-xl border border-white/5 flex items-center gap-3 min-w-[130px]">
            <Coins className="w-4 h-4 text-[var(--cyber-accent)] opacity-70" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-zinc-600 font-mono tracking-[0.15em]">Credits</span>
              <span className="text-lg font-mono font-bold text-[var(--cyber-accent)] neon-text-subtle" style={{ '--cyber-glow': 'rgba(250, 204, 21, 0.25)' } as React.CSSProperties}>
                {cyberCredits.toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* Breach */}
          <div className="px-4 py-2.5 bg-black/50 rounded-xl border border-white/5 flex items-center gap-3 min-w-[160px]">
            <AlertTriangle className={`w-4 h-4 ${breachMeter > 50 ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`} />
            <div className="flex flex-col flex-1">
              <span className="text-[9px] uppercase text-zinc-600 font-mono tracking-[0.15em]">Breach Level</span>
              <div className="w-full h-2 bg-black/60 rounded-full mt-1 overflow-hidden relative border border-white/5">
                <div 
                  className="h-full rounded-full transition-all duration-700 ease-out relative status-bar-fill"
                  style={{ 
                    width: `${breachMeter}%`,
                    background: breachMeter > 60 
                      ? 'linear-gradient(90deg, #ef4444, #f97316)' 
                      : breachMeter > 30 
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                        : 'linear-gradient(90deg, #22c55e, #f59e0b)'
                  }}
                >
                  {breachMeter > 10 && (
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 rounded-full animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAttacker ? 'bg-red-500 shadow-neon-red' : 'bg-sky-500 shadow-neon-blue'}`} />
            <span className="text-sm md:text-base uppercase tracking-[0.15em] font-display font-bold text-[var(--cyber-primary)]">
              {isAttacker ? 'INFILTRATOR' : 'GUARDIAN'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setRole(null)}
              className="cyber-btn px-4 md:px-5 py-2 rounded-lg text-[10px] font-display font-bold uppercase border border-white/10 text-zinc-400 hover:text-white hover:border-zinc-500/40 hover:bg-zinc-500/10 flex items-center gap-2 transition-all duration-300 tracking-wider"
              title="Return to Role Selection"
            >
              <span className="hidden md:inline">Back</span>
            </button>
            <button 
              onClick={() => setRole(isAttacker ? 'defender' : 'attacker')}
              className="cyber-btn px-4 md:px-5 py-2 rounded-lg text-[10px] font-display font-bold uppercase border border-white/10 text-zinc-400 hover:text-white hover:border-[var(--cyber-primary)]/40 hover:bg-[var(--cyber-primary)]/10 flex items-center gap-2 transition-all duration-300 tracking-wider"
              title="Switch Role"
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span className="hidden md:inline">Switch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 relative flex items-center justify-center bg-[#050507] overflow-hidden">
        <div className="absolute inset-0 cyber-grid-bg" />
        <PhaserGame />
      </div>

      {/* Campaign Victory Overlay */}
      <AnimatePresence>
        {campaignComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="px-8 py-4 bg-[var(--cyber-primary)]/10 border border-[var(--cyber-primary)]/30 rounded-2xl flex items-center gap-6 shadow-[0_0_50px_rgba(var(--cyber-primary-rgb),0.2)]"
            >
              <div className="w-12 h-12 bg-[var(--cyber-primary)]/20 rounded-xl flex items-center justify-center border border-[var(--cyber-primary)]/40">
                <Coins className="w-6 h-6 text-[var(--cyber-primary)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[var(--cyber-primary)] uppercase tracking-[0.3em] font-bold">Campaign Milestone</span>
                <h3 className="text-xl font-display font-bold text-white tracking-wider uppercase">Castle Mainframe Secured</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission Modals */}
      {currentLevel !== null && missionState === 'briefing' && (
        <MissionBriefing level={currentLevel} role={role!} />
      )}
      {currentLevel !== null && missionState === 'playing' && (
        <MinigameModal level={currentLevel} role={role!} />
      )}

      {/* Stats Modal */}
      <AnimatePresence>
        {showStats && (
          <StatsModal onClose={() => setShowStats(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
