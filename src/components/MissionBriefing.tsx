import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Target, Trophy, Cpu, ChevronRight, Hexagon } from 'lucide-react';

interface MissionBriefingProps {
  level: number;
  role: 'attacker' | 'defender';
}

const MISSION_DATA = {
  1: {
    name: "The Lobby: Firewall Setup",
    attacker: {
      objectives: ["Deploy breach node.", "Bypass the main firewall.", "Infiltrate perimeter."],
      rewards: [100, "Level 2 Access"]
    },
    defender: {
      objectives: ["Analyze incoming traffic.", "Place firewall blocks.", "Stop the red beam."],
      rewards: [100, "Level 2 Access"]
    }
  },
  2: {
    name: "Workstation: Phishing Filter",
    attacker: {
      objectives: ["Inject malicious payloads.", "Bypass email scanner.", "Compromise workstation."],
      rewards: [200, "Level 3 Access"]
    },
    defender: {
      objectives: ["Monitor mail conveyor.", "Destroy red envelopes.", "Maintain 90% accuracy."],
      rewards: [200, "Level 3 Access"]
    }
  },
  3: {
    name: "Executive Suite: Code Decryptor",
    attacker: {
      objectives: ["Corrupt the binary grid.", "Click glitched blocks.", "Shatter encryption."],
      rewards: [300, "Level 4 Access"]
    },
    defender: {
      objectives: ["Stabilize the binary matrix.", "Patch glitched blocks.", "Secure the suite."],
      rewards: [300, "Level 4 Access"]
    }
  },
  4: {
    name: "Server Cluster Alpha: DDOS Balancer",
    attacker: {
      objectives: ["Route botnet traffic.", "Overload load balancers.", "Crash Server Alpha."],
      rewards: [400, "Level 5 Access"]
    },
    defender: {
      objectives: ["Rotate load balancers.", "Divert red traffic.", "Protect Server Alpha."],
      rewards: [400, "Level 5 Access"]
    }
  },
  5: {
    name: "Network Closet: Swarm Hunter",
    attacker: {
      objectives: ["Deploy swarm bots.", "Navigate the grid.", "Infect network nodes."],
      rewards: [500, "Level 6 Access"]
    },
    defender: {
      objectives: ["Track swarm bots.", "Click to destroy bots.", "Clear the network."],
      rewards: [500, "Level 6 Access"]
    }
  },
  6: {
    name: "Encryption Node: Ransomware",
    attacker: {
      objectives: ["Trigger encryption.", "Align lock rings.", "Lock the system."],
      rewards: [750, "Level 7 Access"]
    },
    defender: {
      objectives: ["System Locked!", "Align lock rings to decrypt.", "Beat the 30s timer."],
      rewards: [750, "Level 7 Access"]
    }
  },
  7: {
    name: "AI Defense Core: Memory Leak",
    attacker: {
      objectives: ["Over-pressurize pipes.", "Cause memory leaks.", "Drain AI resources."],
      rewards: [1000, "Final Level Access"]
    },
    defender: {
      objectives: ["Monitor data pipes.", "Drag patches to bursts.", "Prevent memory leak."],
      rewards: [1000, "Final Level Access"]
    }
  },
  8: {
    name: "The Castle: Mainframe Overload",
    attacker: {
      objectives: ["Launch triple-threat attack.", "Overload all systems.", "Capture the Castle."],
      rewards: [5000, "Campaign Victory"]
    },
    defender: {
      objectives: ["Defend the Castle.", "Manage all 3 threat meters.", "Survive 60 seconds."],
      rewards: [5000, "Campaign Victory"]
    }
  }
};

export default function MissionBriefing({ level, role }: MissionBriefingProps) {
  const setMissionState = useGameStore((state) => state.setMissionState);
  const setCurrentLevel = useGameStore((state) => state.setCurrentLevel);
  const isAttacker = role === 'attacker';

  const data = MISSION_DATA[level as keyof typeof MISSION_DATA] || MISSION_DATA[1];
  const roleData = data[role];
  const accentColor = isAttacker ? 'red' : 'sky';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full max-w-3xl glass-panel-elevated overflow-hidden flex flex-col md:flex-row relative`}
      >
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-${accentColor}-500/60 to-transparent z-20`} />

        {/* Left Side: Visual */}
        <div className="md:w-2/5 bg-black/40 p-8 flex flex-col items-center justify-center border-r border-white/5 relative overflow-hidden z-10">
          <div className="absolute inset-0 cyber-grid-bg" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${isAttacker ? 'rgba(255,59,59,0.08)' : 'rgba(56,189,248,0.08)'} 0%, transparent 70%)` }} />
          
          {/* Animated icon */}
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 mb-6"
          >
            <div className={`absolute -inset-4 border border-${accentColor}-500/10 rounded-full animate-pulse-ring`} />
            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-${accentColor}-500/20 to-transparent border border-${accentColor}-500/20 flex items-center justify-center ${isAttacker ? 'shadow-neon-red' : 'shadow-neon-blue'}`}>
              <Cpu className={`w-12 h-12 text-${accentColor}-400 rounded-full`} />
            </div>
          </motion.div>
          
          <h2 className="font-display text-lg font-bold tracking-[0.2em] text-center text-white z-10">MISSION {level}</h2>
          <div className={`mt-2 px-4 py-1.5 text-[10px] font-display font-bold rounded-lg tracking-wider z-10 ${isAttacker ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
            {isAttacker ? 'ATTACK VECTOR' : 'DEFENSE PROTOCOL'}
          </div>
          
          {/* Decorative hexagons */}
          <Hexagon className={`absolute bottom-4 left-4 w-6 h-6 text-${accentColor}-500/10`} />
          <Hexagon className={`absolute top-6 right-6 w-4 h-4 text-${accentColor}-500/10 rotate-45`} />
        </div>

        {/* Right Side */}
        <div className="md:w-3/5 p-8 flex flex-col z-10 bg-[#0a0a0f]">
          <h1 className="font-display text-2xl font-bold text-white mb-1 tracking-wider">{data.name}</h1>
          <p className="text-zinc-600 text-[10px] mb-7 uppercase tracking-[0.2em] font-mono">Operation Briefing // Classified</p>

          <div className="space-y-5 flex-1">
            {/* Objectives */}
            <div>
              <h3 className="flex items-center gap-2 text-zinc-400 font-display text-xs font-bold mb-3 tracking-wider">
                <Target className="w-4 h-4 text-amber-500" /> OBJECTIVES
              </h3>
              <ul className="space-y-2.5">
                {roleData.objectives.map((obj, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm text-zinc-400"
                  >
                    <ChevronRight className={`w-3 h-3 text-${accentColor}-500 flex-shrink-0`} />
                    <span>{obj}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Rewards */}
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
              <h3 className="flex items-center gap-2 text-zinc-400 font-display text-xs font-bold mb-3 tracking-wider">
                <Trophy className="w-4 h-4 text-amber-500" /> REWARDS
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" /> 
                  <span className="font-mono font-bold text-white">{roleData.rewards[0]}</span> Cyber Credits
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> 
                  <span className="font-mono font-bold text-white">{roleData.rewards[1]}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-7 pt-5 border-t border-white/5">
            <button 
              onClick={() => setCurrentLevel(null)}
              className="px-5 py-3 rounded-xl font-display text-[10px] font-bold uppercase tracking-[0.15em] border border-white/10 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-all"
            >
              Abort
            </button>
            <button 
              onClick={() => setMissionState('playing')}
              className={`cyber-btn flex-1 py-3 px-6 rounded-xl font-display text-xs font-bold uppercase tracking-[0.15em] text-white transition-all transform hover:scale-[1.02] active:scale-95 ${
                isAttacker 
                  ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-neon-red hover:from-red-500 hover:to-red-400' 
                  : 'bg-gradient-to-r from-sky-600 to-cyan-600 shadow-neon-blue hover:from-sky-500 hover:to-cyan-500'
              }`}
            >
              Initialize Mission
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
