import { motion } from 'framer-motion';
import { Shield, Skull, Zap } from 'lucide-react';

interface HUDProps {
  isAttacker: boolean;
  title: string;
  subtitle: string;
  stats: { label: string; value: string | number; color?: string; pulse?: boolean }[];
  combo?: number;
  powerUp?: string | null;
  children?: React.ReactNode;
}

export default function GameHUD({ isAttacker, title, subtitle, stats, combo, powerUp, children }: HUDProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center md:items-start z-10 mb-6 gap-6 relative">
      {/* Left: Title Block */}
      <div className="flex-1 min-w-0 w-full md:w-auto">
        <div className="flex items-center gap-4 mb-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isAttacker ? 'bg-red-500/10 border border-red-500/20' : 'bg-sky-500/10 border border-sky-500/20'}`}>
            {isAttacker ? <Skull className="w-5 h-5 text-red-400" /> : <Shield className="w-5 h-5 text-sky-400" />}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg md:text-xl font-bold text-white tracking-[0.15em] uppercase leading-none truncate">
              {title}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-[8px] font-display font-bold border tracking-wider flex-shrink-0 ${isAttacker ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'}`}>
                {isAttacker ? 'RED TEAM' : 'BLUE TEAM'}
              </span>
              <p className="text-zinc-600 text-[10px] uppercase tracking-wide font-mono truncate">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Combo & Powerup */}
      <div className="flex items-center gap-4">
        {combo !== undefined && combo > 1 && (
          <motion.div
            key={combo}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center px-4 border-l border-r border-white/5"
          >
            <div className="text-[8px] font-mono text-amber-500 uppercase tracking-wider">Combo</div>
            <div className="text-2xl font-display font-black text-amber-400" style={{ textShadow: '0 0 20px rgba(251,191,36,0.5)' }}>
              x{combo}
            </div>
          </motion.div>
        )}

        {powerUp && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl powerup-glow"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-display font-bold text-amber-400 uppercase tracking-wider">{powerUp}</span>
          </motion.div>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex gap-6 md:gap-8 justify-center md:justify-end w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
        {stats.map((stat, i) => (
          <div key={i} className="text-center md:text-right min-w-[70px]">
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-1.5">{stat.label}</div>
            <div className={`text-xl md:text-2xl font-mono font-bold ${stat.pulse ? 'animate-pulse' : ''} ${stat.color || (isAttacker ? 'text-red-400' : 'text-sky-400')}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}

// Score fly-up component
export function ScoreFly({ x, y, value, color = '#38bdf8' }: { x: number; y: number; value: string; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.2 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="absolute pointer-events-none font-display font-black text-sm z-50"
      style={{ left: x, top: y, color, textShadow: `0 0 10px ${color}` }}
    >
      {value}
    </motion.div>
  );
}

// Progress bar component
export function GameProgressBar({ progress, color, label, showPercent = true }: { progress: number; color: string; label: string; showPercent?: boolean }) {
  return (
    <div className="mt-3 z-10">
      <div className="flex justify-between text-[8px] font-mono text-zinc-600 uppercase tracking-wider mb-1.5">
        <span>{label}</span>
        {showPercent && <span>{Math.floor(progress)}%</span>}
      </div>
      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: color, boxShadow: `0 0 12px ${color}40` }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 status-bar-fill" />
        </motion.div>
      </div>
    </div>
  );
}
