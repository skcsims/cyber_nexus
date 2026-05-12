import { X, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGameStore, type Role } from '../store/gameStore';
import FirewallSetupGame from './minigames/FirewallSetupGame';
import PhishingGame from './minigames/PhishingGame';
import PasswordGame from './minigames/PasswordGame';
import MitmGame from './minigames/MitmGame';
import MalwareGame from './minigames/MalwareGame';
import RansomwareGame from './minigames/RansomwareGame';
import MemoryLeakGame from './minigames/MemoryLeakGame';
import MainframeGame from './minigames/MainframeGame';

interface MinigameModalProps {
  level: number;
  role: Role;
}

export default function MinigameModal({ level, role }: MinigameModalProps) {
  const setCurrentLevel = useGameStore((state) => state.setCurrentLevel);

  const getMinigameContent = () => {
    switch (level) {
      case 1:
        return <FirewallSetupGame role={role} />;
      case 2:
        return <PhishingGame role={role} />;
      case 3:
        return <PasswordGame role={role} />;
      case 4:
        return <MitmGame role={role} />;
      case 5:
        return <MalwareGame role={role} />;
      case 6:
        return <RansomwareGame role={role} />;
      case 7:
        return <MemoryLeakGame role={role} />;
      case 8:
        return <MainframeGame role={role} />;
      default:
        return <div className="text-white text-center py-20 font-mono">Unknown Level</div>;
    }
  };

  const getLevelName = () => {
    switch (level) {
      case 1: return "The Lobby — Firewall Setup";
      case 2: return "Workstation — Phishing Filter";
      case 3: return "Exec Suite — Code Decryptor";
      case 4: return "Network Closet — MITM Defense";
      case 5: return "Server Room — Malware Purge";
      case 6: return "Encryption Node — Ransomware";
      case 7: return "AI Defense Core — Memory Leak";
      case 8: return "The Castle — Mainframe Overload";
      default: return "Unknown Sector";
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl max-h-full flex flex-col glass-panel-elevated overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--cyber-primary)]/40 to-transparent" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/5 bg-black/30 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-red-500/60">REC</span>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600">Active Sector</span>
              <h2 className="text-sm md:text-base font-display font-bold text-white tracking-wider">{getLevelName()}</h2>
            </div>
          </div>
          <button 
            onClick={() => setCurrentLevel(null)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-all group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 relative overflow-auto bg-[#060609] z-10">
          <div className="scanline opacity-20" />
          {getMinigameContent()}
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent z-10" />
      </motion.div>
    </div>
  );
}
