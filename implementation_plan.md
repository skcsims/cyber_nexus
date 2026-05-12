# CyberNexus Minigame Mega-Upgrade — From Simple to AAA-Grade

Transform all 6 minigames from basic interactive demos into immersive, high-end cybersecurity experiences with pseudo-3D visuals, rich interactivity, particle systems, and deep gameplay mechanics.

## Current State Analysis

| Game | Current Issues |
|------|---------------|
| **FirewallSetupGame** | Defender: basic laser-track UI. Attacker: orbital breach is decent but lacks depth |
| **PhishingGame** | Defender: flat envelope conveyor. Attacker: simple 3-step picker |
| **PasswordGame** | Defender: 8×8 grid of 0s/1s. Attacker: 2-slider waveform |
| **MitmGame** | Defender: tiny 400px packet box. Attacker: 1 slider + basic range input |
| **MalwareGame** | Defender: 4×4 whack-a-mole. Attacker: arrow-key 5×5 grid |
| **SocialEngineeringGame** | Most basic — simple text quiz with no visual flair |

## Open Questions

> [!IMPORTANT]
> **Scope check**: This plan covers **all 6 minigames** with deep upgrades. Each game file will be 400-600+ lines. This is a large change touching ~3500+ lines of code. Shall I proceed with all 6 at once, or would you prefer to batch them (e.g., 3 games at a time)?

> [!NOTE]
> The SocialEngineeringGame is currently not wired into `MinigameModal.tsx` (it exists but isn't in the switch-case). Should I wire it as level 6, or keep it unwired for now?

## Proposed Changes

### Design Philosophy

Every game will feel like a **standalone AAA cyber-experience**, not a quiz. Key principles:
1. **Pseudo-3D / Isometric visuals** — CSS 3D transforms, layered depth, perspective grids, SVG-rendered 3D elements (like the CoC-style buildings already in the map)
2. **Canvas-rendered particle systems** — Each game gets its own `<canvas>` layer for real-time particles (sparks, data streams, explosions)
3. **Rich HUD** — Every game gets a full status dashboard with animated progress bars, combo counters, threat levels, timers with visual urgency
4. **Sound-ready architecture** — Visual feedback cues (screen shake, flash overlays, pulse effects) that substitute for sound
5. **Deep gameplay** — Multiple phases, difficulty scaling, combo systems, power-ups, and strategic depth
6. **Blue vs Red theming** — Each game adapts visuals, terminology, and mechanics to the player's role

---

### Component: Shared Game Infrastructure

#### [NEW] [GameCanvas.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/minigames/GameCanvas.tsx)
- Reusable `<canvas>` overlay component for particle effects
- Supports: sparks, data streams, explosions, grid lines, scanlines
- Used by all 6 games for visual richness

#### [NEW] [GameHUD.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/minigames/GameHUD.tsx)
- Shared HUD bar component with:
  - Animated HP/Shield bar
  - Combo counter with multiplier
  - Timer with urgency pulsing
  - Score with count-up animation
  - Threat level indicator
  - XP gain display

---

### Component: FirewallSetupGame (Level 1)

#### [MODIFY] [FirewallSetupGame.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/minigames/FirewallSetupGame.tsx)

**Defender — "FORTRESS PROTOCOL":**
- 3D perspective grid showing incoming threats as animated projectiles with trails
- Multiple firewall types (Ice Wall, EMP Barrier, Data Shield) with different properties
- Threats come in waves with boss threats
- Power-ups drop from destroyed threats (shield recharge, time slow, EMP blast)
- Combo system for consecutive blocks
- Screen shake on impact, particle explosions on block

**Attacker — "SIEGE ENGINE":**
- Rotating shield ring replaced with a full orbital defense system visualization
- Multiple payload types (Trojan, Worm, Logic Bomb) with different penetration angles
- Shield has multiple layers that degrade
- Timing-based precision launch with charge-up mechanic
- Visual trajectory preview with arc calculation

---

### Component: PhishingGame (Level 2)

#### [MODIFY] [PhishingGame.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/minigames/PhishingGame.tsx)

**Defender — "INBOX SENTINEL":**
- 3D perspective conveyor belt with depth layers
- Emails rendered as actual mini-email previews with sender, subject, red flags
- Scanner beam that you control, sweeping across lanes
- Threat analysis popup when hovering emails showing risk factors
- Chain-kill bonuses for consecutive correct identifications
- Boss wave: sophisticated spear-phishing that looks legitimate

**Attacker — "PAYLOAD ARCHITECT":**
- Full email construction workbench with drag-and-drop components
- Real-time "detection probability" meter that changes as you craft
- Multiple target profiles to choose from (CEO, IT Admin, Intern)
- Evasion techniques you unlock (typosquatting, URL obfuscation, urgency triggers)
- Live preview of the crafted email with authenticity score

---

### Component: PasswordGame (Level 3)

#### [MODIFY] [PasswordGame.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/minigames/PasswordGame.tsx)

**Defender — "MATRIX GUARDIAN":**
- 8×8 grid replaced with animated hex-grid with 3D depth effect
- Glitched cells show actual corruption patterns (spreading infection)
- Stabilization creates visual "repair" animation with particle healing
- Corruption spreads to adjacent cells if not caught (cellular automaton)
- Shield power-up: freeze corruption for 3 seconds
- Progress shown as a 3D decryption cylinder visualization

**Attacker — "FREQUENCY CRACKER":**
- Dual-axis waveform display with oscilloscope aesthetic
- Real-time animated SVG waveforms (not static lines)
- Noise interference that shifts the target randomly
- Multiple frequency locks to crack in sequence
- Each cracked lock triggers a visual "breach" animation
- Bonus precision scoring for exact matches

---

### Component: MitmGame (Level 4)

#### [MODIFY] [MitmGame.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/minigames/MitmGame.tsx)

**Defender — "ENCRYPTION FORTRESS":**
- Full network topology visualization with nodes and connections
- Packets travel along animated paths between nodes
- Drag encryption shields onto connection paths (not just 1 shield)
- Multiple simultaneous packet streams with priority indicators
- Encrypted vs unencrypted packets have distinct visual states
- Network health dashboard showing per-connection status

**Attacker — "SIGNAL INTERCEPTOR":**
- Full spectrum analyzer with multiple frequency bands
- Visual oscilloscope with real-time waveform rendering
- Multiple data streams to intercept simultaneously
- Stealth meter: getting detected triggers countermeasures
- Decoded data fragments appear as you maintain lock
- Boss phase: encrypted stream requires key-cracking mini-puzzle

---

### Component: MalwareGame (Level 5)

#### [MODIFY] [MalwareGame.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/minigames/MalwareGame.tsx)

**Defender — "VIRUS HUNTER":**
- Server rack visualization with 3D perspective (isometric server cabinets)
- Malware spreads visually between connected nodes with infection trails
- Multiple malware types: Worm (spreads fast), Trojan (hidden), Ransomware (locks nodes)
- Antivirus tools: Quick Scan (single node), Deep Scan (area), Quarantine (isolate)
- System health shown as server temperature gauge
- Boss virus: polymorphic malware that changes appearance

**Attacker — "SYSTEM INFILTRATOR":**
- Full grid-based stealth game with fog of war
- Arrow keys + WASD for movement, patrol patterns for security bots
- Multiple upload points requiring sequential activation
- Stealth meter with detection cone visualization
- Hackable cameras and distractions as power-ups
- Terminal hacking mini-puzzle at upload points

---

### Component: SocialEngineeringGame (Level 6+)

#### [MODIFY] [SocialEngineeringGame.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/minigames/SocialEngineeringGame.tsx)

**Defender — "ACCESS CONTROL":**
- Full ID card inspection interface with magnifying glass tool
- 3D rotating ID cards with multiple checkpoints (photo match, hologram, barcode)
- Security camera feed showing the person
- Verification database to cross-reference
- Time pressure with queue building up
- Increasingly sophisticated forgeries

**Attacker — "SOCIAL ARCHITECT":**
- Visual disguise builder with layered equipment selection
- Conversation tree with branching dialogue
- NPC reactions shown via expression/mood indicators
- Suspicion meter that responds to dialogue choices
- Environmental interaction (prop placement, timing entry)
- Multiple infiltration paths with risk/reward trade-offs

---

### Component: CSS & Visual Infrastructure

#### [MODIFY] [index.css](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/index.css)
- Add 20+ new CSS animations for game effects
- 3D transform utilities for perspective grids
- New shadow/glow presets for different game elements
- Particle effect base styles
- Screen shake keyframes
- Combo counter animations

---

### Component: MinigameModal Enhancement

#### [MODIFY] [MinigameModal.tsx](file:///c:/Users/Shreyash/Downloads/cyber/cyber/src/components/MinigameModal.tsx)
- Increase modal size to near-fullscreen for better gameplay
- Add game-specific background themes
- Enhanced header with game difficulty indicator
- Wire SocialEngineeringGame as level 6 (if approved)

---

## Verification Plan

### Automated Tests
- Build check: `npm run build` to verify TypeScript compilation
- Manual browser testing of all 12 game modes (6 games × 2 roles)

### Manual Verification
- Open each game in both Attacker and Defender mode
- Verify all particle effects render correctly
- Check win/loss conditions trigger properly
- Confirm score/credits/unlock integration with game store
- Test responsiveness at different viewport sizes
