import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Fingerprint, Wifi, Loader2, UserPlus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bootText, setBootText] = useState('');
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const setStoreUsername = useGameStore(state => state.setUsername);
  const setUserId = useGameStore(state => state.setUserId);
  const setCredits = useGameStore(state => state.setCredits);
  const unlockAllLevels = useGameStore(state => state.unlockAllLevels);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      // Secret Unlock Code
      if (username === 'shreyash' && password === '4545') {
        unlockAllLevels();
        setStoreUsername('ADMIN_OVERRIDE');
        onLogin();
        return;
      }

      if (!supabase) {
        // Fallback for offline/no-supabase mode
        setStoreUsername(username);
        onLogin();
        return;
      }

      setLoading(true);
      setErrorMsg('');
      // Sanitize username by removing spaces for the internal email format
      const sanitizedUsername = username.replace(/\s+/g, '');
      const email = sanitizedUsername.includes('@') ? sanitizedUsername : `${sanitizedUsername}@cybernexus.agent`;

      try {
        if (isRegistering) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          
          if (data.user) {
            // Initialize profile
            const { error: profileError } = await supabase.from('profiles').insert([
              { id: data.user.id, username: username, score: 0 }
            ]);
            if (profileError) console.error("Profile creation error:", profileError);

            setUserId(data.user.id);
            setStoreUsername(username);
            onLogin();
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          
          if (data.user) {
            setUserId(data.user.id);
            setStoreUsername(username);

            // Fetch their saved score
            const { data: profileData } = await supabase
              .from('profiles')
              .select('score')
              .eq('id', data.user.id)
              .single();
            
            if (profileData) {
              setCredits(profileData.score);
            } else {
              // If profile doesn't exist yet, create it
              await supabase.from('profiles').upsert({ id: data.user.id, username: username, score: 0 });
              setCredits(0);
            }

            onLogin();
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }
  };

  // Terminal boot text animation
  const bootLines = [
    '> Initializing secure connection...',
    '> Encrypting channel... AES-256-GCM',
    '> Verifying server certificates...',
    '> Connection established. Awaiting credentials.',
  ];

  useEffect(() => {
    let currentLine = 0;
    let currentChar = 0;
    let text = '';
    const interval = setInterval(() => {
      if (currentLine >= bootLines.length) {
        clearInterval(interval);
        return;
      }
      text += bootLines[currentLine][currentChar];
      setBootText(text);
      currentChar++;
      if (currentChar >= bootLines[currentLine].length) {
        text += '\n';
        currentLine++;
        currentChar = 0;
      }
    }, 25);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#050507] overflow-hidden theme-cyber">

      {/* Layered backgrounds */}
      <div className="absolute inset-0">
        {/* Hex grid */}
        <div className="absolute inset-0 hex-grid-bg opacity-60" />

        {/* Perspective grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            transform: 'perspective(600px) rotateX(65deg) translateY(-50px) scale(2)',
            transformOrigin: 'center top',
          }}
        />

        {/* Radial glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(56,189,248,0.08) 0%, transparent 60%)'
        }} />

        {/* Floating particles */}
        <div className="absolute inset-0 particle-field opacity-40" />

        {/* Vignette */}
        <div className="absolute inset-0 vignette" />
      </div>

      <div className="scanline" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel-elevated p-10 w-full max-w-md z-10 relative corner-brackets noise-overlay"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />

        {/* Logo section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="relative inline-flex items-center justify-center mb-6"
          >
            <div className="absolute w-24 h-24 border border-sky-500/20 rounded-full animate-pulse-ring" />
            <div className="absolute w-20 h-20 border border-sky-500/10 rounded-full" style={{ animation: 'hex-rotate 12s linear infinite' }} />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/10 border border-sky-500/30 flex items-center justify-center shadow-neon-blue">
              <Shield className="w-8 h-8 text-sky-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-display text-3xl font-bold text-white tracking-[0.25em] mb-2 glitch-text"
          >
            CYBER_NEXUS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-zinc-500 text-[11px] uppercase tracking-[0.3em] font-mono"
          >
            Shreyash Utekar
          </motion.p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
            <label className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-2 font-mono font-bold">
              <Fingerprint className="w-3 h-3" /> Operative ID
            </label>
            <div className={`relative rounded-xl transition-all duration-300 ${isFocused === 'user' ? 'shadow-neon-blue' : ''}`}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsFocused('user')}
                onBlur={() => setIsFocused(null)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-zinc-700"
                placeholder="agent_id"
                required
              />
              {isFocused === 'user' && (
                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
            <label className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-[0.2em] mb-2 font-mono font-bold">
              <Lock className="w-3 h-3" /> Access Code
            </label>
            <div className={`relative rounded-xl transition-all duration-300 ${isFocused === 'pass' ? 'shadow-neon-blue' : ''}`}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused('pass')}
                onBlur={() => setIsFocused(null)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3.5 text-white font-mono text-sm focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-zinc-700"
                placeholder="••••••••••"
                required
              />
              {isFocused === 'pass' && (
                <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
              )}
            </div>
          </motion.div>

          {errorMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-[11px] text-center font-mono bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {errorMsg}
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            type="submit"
            disabled={loading}
            className={`cyber-btn w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-display font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-neon-blue tracking-[0.2em] text-sm uppercase mt-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <span className="flex items-center justify-center gap-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              {isRegistering ? 'Register Operative' : 'Initialize Uplink'}
            </span>
          </motion.button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(''); }}
              className="text-sky-500/60 hover:text-sky-400 text-[10px] uppercase tracking-widest font-mono transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              {isRegistering ? 'Return to Login' : <><UserPlus className="w-3 h-3"/> Register New Operative</>}
            </button>
          </div>
        </form>

        {/* Boot terminal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 border-t border-white/5 pt-5"
        >
          <pre className="text-[10px] text-sky-500/40 font-mono leading-relaxed whitespace-pre-wrap h-16 overflow-hidden">
            {bootText}<span className="inline-block w-1.5 h-3 bg-sky-500/60 ml-0.5" style={{ animation: 'typing-cursor 0.8s infinite' }} />
          </pre>
        </motion.div>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>

      {/* Ambient drift particles */}
      <div className="drift-particle" style={{ top: '10%', left: '15%', '--size': '2px', '--drift-x': '60px', '--drift-y': '-180px', '--duration': '7s', '--delay': '0s', '--color': 'rgba(56,189,248,0.3)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '30%', right: '20%', '--size': '3px', '--drift-x': '-40px', '--drift-y': '-220px', '--duration': '9s', '--delay': '1.5s', '--color': 'rgba(34,211,238,0.25)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '60%', left: '25%', '--size': '1.5px', '--drift-x': '80px', '--drift-y': '-150px', '--duration': '11s', '--delay': '3s', '--color': 'rgba(56,189,248,0.2)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '80%', right: '30%', '--size': '2.5px', '--drift-x': '-50px', '--drift-y': '-250px', '--duration': '8s', '--delay': '0.5s', '--color': 'rgba(74,222,128,0.2)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '45%', left: '8%', '--size': '2px', '--drift-x': '100px', '--drift-y': '-130px', '--duration': '10s', '--delay': '2s', '--color': 'rgba(56,189,248,0.15)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '70%', right: '10%', '--size': '1px', '--drift-x': '-70px', '--drift-y': '-200px', '--duration': '12s', '--delay': '4s', '--color': 'rgba(192,132,252,0.2)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '20%', left: '60%', '--size': '2px', '--drift-x': '30px', '--drift-y': '-160px', '--duration': '6s', '--delay': '5s', '--color': 'rgba(56,189,248,0.25)' } as React.CSSProperties} />
      <div className="drift-particle" style={{ top: '90%', left: '40%', '--size': '3px', '--drift-x': '-20px', '--drift-y': '-300px', '--duration': '13s', '--delay': '1s', '--color': 'rgba(34,211,238,0.2)' } as React.CSSProperties} />
    </div>
  );
}

