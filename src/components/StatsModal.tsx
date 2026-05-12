import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Shield, RefreshCw, Medal, Target, Zap, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';

interface StatsModalProps {
  onClose: () => void;
  initialTab?: 'leaderboard' | 'achievements';
}

interface Profile {
  id: string;
  username: string;
  score: number;
}

export default function StatsModal({ onClose, initialTab = 'leaderboard' }: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements'>(initialTab);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const completedLevels = useGameStore(state => state.completedLevels);
  const cyberCredits = useGameStore(state => state.cyberCredits);

  const fetchLeaderboard = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, score')
      .order('score', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching leaderboard:', error);
    } else if (data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const achievements = [
    { id: 'first_op', title: 'First Deployment', desc: 'Complete your first mission', icon: Zap, requirement: (completedLevels.attacker.size + completedLevels.defender.size) > 0 },
    { id: 'rich', title: 'Data Dealer', desc: 'Earn 1,000 Cyber Credits', icon: Medal, requirement: cyberCredits >= 1000 },
    { id: 'master_attacker', title: 'System Breaker', desc: 'Complete all Infiltrator missions', icon: Target, requirement: completedLevels.attacker.size >= 8 },
    { id: 'master_defender', title: 'Firewall Architect', desc: 'Complete all Guardian missions', icon: Shield, requirement: completedLevels.defender.size >= 8 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md theme-cyber">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-[#050507] border border-sky-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.15)] relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-sky-900/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shadow-neon-blue">
               {activeTab === 'leaderboard' ? <Trophy className="w-5 h-5 text-sky-400" /> : <Medal className="w-5 h-5 text-sky-400" />}
             </div>
             <div>
               <h2 className="text-lg font-display font-bold text-white tracking-[0.2em] uppercase">Stats Center</h2>
               <div className="flex gap-4 mt-2">
                 <button 
                   onClick={() => setActiveTab('leaderboard')}
                   className={`text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'text-sky-400 border-b border-sky-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                   Global Rankings
                 </button>
                 <button 
                   onClick={() => setActiveTab('achievements')}
                   className={`text-[10px] font-mono uppercase tracking-widest transition-all ${activeTab === 'achievements' ? 'text-sky-400 border-b border-sky-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                   Achievements
                 </button>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'leaderboard' && (
              <button 
                onClick={fetchLeaderboard}
                className="p-2 text-zinc-500 hover:text-sky-400 transition-colors bg-white/5 rounded-lg"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'leaderboard' ? (
              <motion.div 
                key="leaderboard"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {!supabase ? (
                   <div className="text-center py-10 opacity-50">
                     <Lock className="w-10 h-10 mx-auto mb-3" />
                     <p className="text-xs font-mono">SUPABASE_NOT_CONFIGURED</p>
                   </div>
                ) : loading ? (
                  Array(5).fill(0).map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)
                ) : profiles.map((p, i) => (
                  <div key={p.id} className="flex items-center p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                    <span className={`w-8 font-mono font-bold ${i < 3 ? 'text-sky-400' : 'text-zinc-600'}`}>#{i+1}</span>
                    <span className="flex-1 font-mono text-zinc-200">{p.username}</span>
                    <span className="font-mono text-sky-400 font-bold">{p.score.toLocaleString()} <span className="text-[10px] text-zinc-600">CR</span></span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="achievements"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {achievements.map((ach) => (
                  <div key={ach.id} className={`p-4 rounded-xl border transition-all ${ach.requirement ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/5 opacity-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <ach.icon className={`w-5 h-5 ${ach.requirement ? 'text-sky-400' : 'text-zinc-600'}`} />
                      <h4 className={`text-sm font-display font-bold tracking-wider ${ach.requirement ? 'text-white' : 'text-zinc-500'}`}>{ach.title}</h4>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-body leading-relaxed">{ach.desc}</p>
                    {ach.requirement && (
                      <div className="mt-2 text-[9px] font-mono text-sky-400 uppercase tracking-widest flex items-center gap-1">
                        <Shield className="w-2 h-2" /> Unlocked
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/5 text-center">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Neural Link Status: Active // Latency: 14ms</p>
        </div>
      </motion.div>
    </div>
  );
}
