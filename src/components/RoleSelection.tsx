import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, ShieldCheck, Play, Terminal, Trophy, Map, Zap, Radio } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import CyberRangeModal from './CyberRangeModal';
import StatsModal from './StatsModal';

export default function RoleSelection() {
  const [showCyberRange, setShowCyberRange] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const setRole = useGameStore((state) => state.setRole);
  const username = useGameStore((state) => state.username) || 'GHOST_OP';
  const unlockedLevels = useGameStore((state) => state.unlockedLevels);

  const handleMissionCampaignClick = () => {
    if (unlockedLevels.attacker > unlockedLevels.defender) {
      setRole('attacker');
    } else {
      setRole('defender');
    }
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-[#050507] overflow-hidden theme-cyber p-4 md:p-8">
      {/* Backgrounds */}
      <div className="absolute inset-0 hex-grid-bg opacity-40" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(56,189,248,0.05) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(255,59,59,0.04) 0%, transparent 50%)' }} />
      <div className="absolute inset-0 vignette" />
      <div className="scanline" />

      {/* Ambient drift particles */}
      <div className="drift-particle" style={{ top: '15%', left: '10%', '--size': '2px', '--drift-x': '70px', '--drift-y': '-200px', '--duration': '8s', '--delay': '0s', '--color': 'rgba(56,189,248,0.25)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '80%', right: '15%', '--size': '3px', '--drift-x': '-50px', '--drift-y': '-220px', '--duration': '10s', '--delay': '1s', '--color': 'rgba(255,59,59,0.2)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '60%', left: '30%', '--size': '1.5px', '--drift-x': '90px', '--drift-y': '-150px', '--duration': '12s', '--delay': '3s', '--color': 'rgba(192,132,252,0.2)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '25%', right: '40%', '--size': '2px', '--drift-x': '-60px', '--drift-y': '-180px', '--duration': '9s', '--delay': '2s', '--color': 'rgba(74,222,128,0.2)' } as React.CSSProperties} />

      <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 z-10">
        
        {/* Left Column */}
        <div className="flex flex-col gap-5">
          {/* Profile card */}
          <motion.div variants={fadeUp} className="glass-panel p-6 border-l-2 border-l-sky-500/50 relative noise-overlay">
            <div className="flex items-center gap-3 mb-1">
              <div className="status-dot" />
              <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.2em]">Authenticated</span>
            </div>
            <div className="text-xl font-display font-bold text-white tracking-wider mt-2">
              {username.toUpperCase()}
            </div>
            <div className="text-zinc-600 text-[10px] font-mono mt-1">CLEARANCE: LEVEL 5 // ACTIVE</div>
          </motion.div>

          {/* Action buttons */}
          <motion.div variants={fadeUp} className="glass-panel p-5 grid grid-cols-2 gap-3">
            <button 
              onClick={handleMissionCampaignClick}
              className="cyber-btn flex flex-col items-center justify-center p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl hover:bg-sky-500/20 hover:border-sky-500/40 transition-all col-span-2 group"
            >
              <Play className="text-sky-400 mb-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sky-100 font-display font-bold tracking-[0.15em] text-xs">MISSION CAMPAIGN</span>
            </button>
            <button 
              onClick={() => setShowCyberRange(true)}
              className="cyber-btn flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
            >
              <Terminal className="text-zinc-400 mb-2 w-4 h-4 group-hover:text-white transition-colors" />
              <span className="text-zinc-300 text-[10px] font-display tracking-wider group-hover:text-white transition-colors">CYBER RANGE</span>
            </button>
            <button 
              onClick={() => setShowStats(true)}
              className="cyber-btn flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
            >
              <Trophy className="text-zinc-400 mb-2 w-4 h-4 group-hover:text-sky-400 transition-colors" />
              <span className="text-zinc-300 text-[10px] font-display tracking-wider group-hover:text-white transition-colors">ACHIEVEMENTS</span>
            </button>
          </motion.div>

          {/* Map preview */}
          <motion.div variants={fadeUp} className="glass-panel p-5 flex-1 flex flex-col">
            <h3 className="text-zinc-600 text-[10px] font-display tracking-[0.2em] mb-3 flex items-center gap-2">
              <Map className="w-3 h-3" /> NETWORK MAP
            </h3>
            <div className="w-full flex-1 min-h-[140px] bg-black/40 border border-white/5 rounded-xl overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 cyber-grid-bg" />
              {/* Animated nodes */}
              <div className="absolute w-2 h-2 bg-sky-500/60 rounded-full left-[25%] top-[30%] shadow-neon-blue animate-pulse" />
              <div className="absolute w-2 h-2 bg-sky-500/40 rounded-full left-[60%] top-[50%] shadow-neon-blue animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute w-2 h-2 bg-sky-500/30 rounded-full left-[40%] top-[70%] shadow-neon-blue animate-pulse" style={{ animationDelay: '1s' }} />
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <line x1="25%" y1="30%" x2="60%" y2="50%" stroke="#38bdf8" strokeWidth="1" />
                <line x1="60%" y1="50%" x2="40%" y2="70%" stroke="#38bdf8" strokeWidth="1" />
              </svg>
              <span className="text-sky-500/30 font-mono text-[9px] z-10 absolute bottom-3 tracking-[0.3em] uppercase">Mapping nodes...</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Role Selection */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Header */}
          <motion.div variants={fadeUp} className="glass-panel p-8 text-center relative noise-overlay">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-2 tracking-[0.2em]">SELECT OPERATIVE ROLE</h1>
            <p className="text-zinc-500 text-sm font-body">Authentication verified. Choose your deployment vector.</p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-5 flex-1">
            {/* Attacker */}
            <motion.div
              variants={fadeUp}
              whileHover={{ scale: 1.015, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole('attacker')}
              className="flex-1 glass-panel border-red-500/10 hover:border-red-500/40 cursor-pointer group relative overflow-hidden transition-all duration-500 flex flex-col"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.06] via-transparent to-red-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="p-8 md:p-10 text-center flex flex-col items-center justify-center h-full z-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 w-20 h-20 border border-red-500/10 rounded-full m-auto group-hover:border-red-500/30 transition-all animate-pulse-ring" style={{ top: '-10px', left: '-10px', right: '-10px', bottom: '-10px' }} />
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/15 to-red-900/10 border border-red-500/20 flex items-center justify-center group-hover:shadow-neon-red transition-all duration-500">
                    <Skull className="w-10 h-10 text-red-400 group-hover:text-red-300 transition-colors" />
                  </div>
                </div>
                <h2 className="font-display text-xl font-bold text-red-400 mb-3 tracking-[0.2em] group-hover:neon-text-subtle transition-all" style={{ '--cyber-glow': 'rgba(255,59,59,0.4)' } as React.CSSProperties}>INFILTRATOR</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">Find the weak link. Break through defenses. Secure the payload.</p>
                <div className="mt-6 flex items-center gap-2 text-red-500/40 text-[10px] font-mono tracking-wider group-hover:text-red-400/60 transition-colors">
                  <Zap className="w-3 h-3" /> OFFENSIVE OPS
                </div>
              </div>
            </motion.div>

            {/* Defender */}
            <motion.div
              variants={fadeUp}
              whileHover={{ scale: 1.015, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole('defender')}
              className="flex-1 glass-panel border-sky-500/10 hover:border-sky-500/40 cursor-pointer group relative overflow-hidden transition-all duration-500 flex flex-col"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-sky-500/[0.06] via-transparent to-sky-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="p-8 md:p-10 text-center flex flex-col items-center justify-center h-full z-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 w-20 h-20 border border-sky-500/10 rounded-full m-auto group-hover:border-sky-500/30 transition-all animate-pulse-ring" style={{ top: '-10px', left: '-10px', right: '-10px', bottom: '-10px' }} />
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500/15 to-cyan-900/10 border border-sky-500/20 flex items-center justify-center group-hover:shadow-neon-blue transition-all duration-500">
                    <ShieldCheck className="w-10 h-10 text-sky-400 group-hover:text-sky-300 transition-colors" />
                  </div>
                </div>
                <h2 className="font-display text-xl font-bold text-sky-400 mb-3 tracking-[0.2em] group-hover:neon-text-subtle transition-all" style={{ '--cyber-glow': 'rgba(56,189,248,0.4)' } as React.CSSProperties}>GUARDIAN</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">Spot anomalies. Patch leaks. Hold the line against cyber threats.</p>
                <div className="mt-6 flex items-center gap-2 text-sky-500/40 text-[10px] font-mono tracking-wider group-hover:text-sky-400/60 transition-colors">
                  <Radio className="w-3 h-3" /> DEFENSIVE OPS
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Cyber Range Modal */}
      <AnimatePresence>
        {showCyberRange && (
          <CyberRangeModal onClose={() => setShowCyberRange(false)} />
        )}
        {showStats && (
          <StatsModal onClose={() => setShowStats(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
