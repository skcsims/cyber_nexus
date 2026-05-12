import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Radio, Globe, Database, Lock, ChevronLeft, ChevronRight, X, ShieldAlert, Zap, Terminal } from 'lucide-react';

interface AttackInfo {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
  attackerVector: string;
  defenderMitigation: string;
}

const ATTACKS: AttackInfo[] = [
  {
    id: 'phishing',
    title: 'Phishing & Social Engineering',
    icon: Mail,
    color: '#38bdf8', // Sky
    description: 'The fraudulent practice of sending emails purporting to be from reputable companies in order to induce individuals to reveal personal information, such as passwords and credit card numbers.',
    attackerVector: 'Crafting deceptive emails or messages with malicious links or attachments. Often leverages urgency or authority to bypass human skepticism.',
    defenderMitigation: 'Implement email filtering (SPF, DKIM, DMARC), conduct regular employee security awareness training, and enforce Multi-Factor Authentication (MFA).'
  },
  {
    id: 'mitm',
    title: 'Man-in-the-Middle (MITM)',
    icon: Radio,
    color: '#a855f7', // Purple
    description: 'An attack where the perpetrator secretly relays and possibly alters the communications between two parties who believe they are directly communicating with each other.',
    attackerVector: 'Intercepting unencrypted Wi-Fi traffic, ARP spoofing, or DNS hijacking to eavesdrop on sensitive data exchanges.',
    defenderMitigation: 'Enforce End-to-End Encryption (TLS/HTTPS), utilize Virtual Private Networks (VPNs), and implement strict certificate pinning on critical applications.'
  },
  {
    id: 'ddos',
    title: 'Distributed Denial of Service',
    icon: Globe,
    color: '#ef4444', // Red
    description: 'A malicious attempt to disrupt the normal traffic of a targeted server, service or network by overwhelming the target or its surrounding infrastructure with a flood of Internet traffic.',
    attackerVector: 'Utilizing a botnet (a network of malware-infected computers) to send an overwhelming amount of requests to the target server simultaneously.',
    defenderMitigation: 'Deploy specialized DDoS protection services (e.g., Cloudflare, AWS Shield), implement rate limiting, and design scalable, redundant infrastructure.'
  },
  {
    id: 'sqli',
    title: 'SQL Injection',
    icon: Database,
    color: '#f59e0b', // Amber
    description: 'A code injection technique used to attack data-driven applications, in which malicious SQL statements are inserted into entry fields for execution.',
    attackerVector: 'Inputting specially crafted SQL commands into web forms or URL parameters to manipulate backend databases, bypassing authentication or extracting data.',
    defenderMitigation: 'Always use parameterized queries or prepared statements. Implement strict input validation and sanitization. Use Object-Relational Mapping (ORM) frameworks.'
  },
  {
    id: 'ransomware',
    title: 'Ransomware',
    icon: Lock,
    color: '#10b981', // Emerald
    description: 'A type of malware from cryptovirology that threatens to publish the victim\'s personal data or perpetually block access to it unless a ransom is paid.',
    attackerVector: 'Infecting a system via malicious attachments, compromised websites, or RDP brute-forcing, then rapidly encrypting critical files and network drives.',
    defenderMitigation: 'Maintain offline, immutable backups. Implement endpoint detection and response (EDR) solutions. Restrict administrative privileges (Principle of Least Privilege).'
  }
];

interface Props {
  onClose: () => void;
}

export default function CyberRangeModal({ onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextAttack = () => {
    setCurrentIndex((prev) => (prev + 1) % ATTACKS.length);
  };

  const prevAttack = () => {
    setCurrentIndex((prev) => (prev - 1 + ATTACKS.length) % ATTACKS.length);
  };

  const attack = ATTACKS[currentIndex];
  const Icon = attack.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
      {/* Dynamic ambient glow based on current attack */}
      <div 
        className="absolute inset-0 opacity-20 transition-colors duration-1000 ease-in-out"
        style={{ background: `radial-gradient(circle at 50% 50%, ${attack.color}, transparent 60%)` }}
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-4xl max-h-full flex flex-col glass-panel border border-white/10 rounded-2xl relative shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/40 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg border border-white/10 bg-white/5">
              <Terminal className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white tracking-[0.2em]">CYBER RANGE DATABANKS</h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Threat Intelligence Encyclopedia</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative flex items-center justify-center min-h-[400px] sm:min-h-[500px] overflow-hidden p-6 z-10 bg-black/20">
          {/* Navigation Arrows */}
          <button 
            onClick={prevAttack}
            className="absolute left-4 z-20 p-3 rounded-full bg-black/50 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 hover:scale-110 transition-all backdrop-blur-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={nextAttack}
            className="absolute right-4 z-20 p-3 rounded-full bg-black/50 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 hover:scale-110 transition-all backdrop-blur-sm"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Attack Card Container */}
          <div className="w-full max-w-2xl px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={attack.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Title & Icon */}
                <div className="flex items-center gap-4">
                  <div 
                    className="p-4 rounded-2xl border bg-black/40 shadow-lg relative overflow-hidden"
                    style={{ borderColor: `${attack.color}40`, boxShadow: `0 0 20px ${attack.color}20` }}
                  >
                    <div className="absolute inset-0 opacity-20 animate-pulse" style={{ backgroundColor: attack.color }} />
                    <Icon className="w-10 h-10 relative z-10" style={{ color: attack.color }} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wider uppercase" style={{ textShadow: `0 0 15px ${attack.color}40` }}>
                      {attack.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-widest bg-white/10 text-white/70">
                        ENTRY {currentIndex + 1}/{ATTACKS.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-body">
                    {attack.description}
                  </p>
                </div>

                {/* Vectors & Mitigations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Attacker Vector */}
                  <div className="p-5 rounded-xl border border-red-500/20 bg-red-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                    <h4 className="flex items-center gap-2 text-red-400 font-display text-xs font-bold tracking-widest uppercase mb-3">
                      <Zap className="w-4 h-4" /> Infiltration Vector
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {attack.attackerVector}
                    </p>
                  </div>

                  {/* Defender Mitigation */}
                  <div className="p-5 rounded-xl border border-sky-500/20 bg-sky-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/50" />
                    <h4 className="flex items-center gap-2 text-sky-400 font-display text-xs font-bold tracking-widest uppercase mb-3">
                      <ShieldAlert className="w-4 h-4" /> Defense Protocol
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {attack.defenderMitigation}
                    </p>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Footer Progress Indicators */}
        <div className="h-1 w-full bg-black/50 relative z-10 flex">
          {ATTACKS.map((_, idx) => (
            <div 
              key={idx} 
              className="h-full flex-1 transition-all duration-500 border-r border-black/50 last:border-r-0"
              style={{ 
                backgroundColor: idx === currentIndex ? attack.color : 'transparent',
                opacity: idx === currentIndex ? 0.8 : 0.1
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
