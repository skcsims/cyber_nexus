import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type Role = 'attacker' | 'defender' | null;

export interface GameState {
  username: string | null;
  userId: string | null;
  role: Role;
  cyberCredits: number;
  breachMeter: number;
  unlockedLevels: {
    attacker: number;
    defender: number;
  };
  completedLevels: {
    attacker: Set<number>;
    defender: Set<number>;
  };
  campaignComplete: boolean;
  currentLevel: number | null;
  missionState: 'briefing' | 'playing' | null;
  setUsername: (name: string | null) => void;
  setUserId: (id: string | null) => void;
  setCredits: (amount: number) => void;
  setRole: (role: Role) => void;
  addCredits: (amount: number) => void;
  increaseBreach: (amount: number) => void;
  unlockLevel: (role: 'attacker' | 'defender', level: number) => void;
  markLevelComplete: (role: 'attacker' | 'defender', level: number, credits: number) => void;
  setUnlockedLevels: (attacker: number, defender: number) => void;
  setCompletedLevels: (attacker: number[], defender: number[]) => void;
  setCurrentLevel: (level: number | null) => void;
  setMissionState: (state: 'briefing' | 'playing' | null) => void;
  unlockAllLevels: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  username: null,
  userId: null,
  role: null,
  cyberCredits: 0,
  breachMeter: 0,
  unlockedLevels: { attacker: 1, defender: 1 },
  completedLevels: { attacker: new Set(), defender: new Set() },
  campaignComplete: false,
  currentLevel: null,
  missionState: null,
  setUsername: (name) => set({ username: name }),
  setUserId: (id) => set({ userId: id }),
  setCredits: (amount) => set({ cyberCredits: amount }),
  setRole: (role) => set({ role }),
  addCredits: (amount) => set((state) => ({ cyberCredits: state.cyberCredits + amount })),
  increaseBreach: (amount) => set((state) => ({ breachMeter: Math.min(100, state.breachMeter + amount) })),
  unlockLevel: (role, level) => set((state) => ({ 
    unlockedLevels: {
      ...state.unlockedLevels,
      [role]: Math.max(state.unlockedLevels[role], Math.min(level, 8))
    }
  })),
  markLevelComplete: (role, level, credits) => set((state) => {
    const newCompleted = new Set(state.completedLevels[role]);
    newCompleted.add(level);
    
    const nextLevel = level + 1;
    const isCampaignWin = level === 8;
    const newCredits = state.cyberCredits + credits;
    const newUnlocked = Math.max(state.unlockedLevels[role], Math.min(nextLevel, 8));

    // Background sync to Supabase (Upsert ensures row exists)
    if (supabase && state.userId) {
      const updateData: any = { 
        id: state.userId, 
        score: newCredits,
        username: state.username || 'Agent'
      };

      // Store as arrays for Supabase compatibility
      if (role === 'attacker') {
        updateData.unlocked_attacker = newUnlocked;
        updateData.completed_attacker = Array.from(newCompleted);
      } else {
        updateData.unlocked_defender = newUnlocked;
        updateData.completed_defender = Array.from(newCompleted);
      }

      supabase.from('profiles').upsert(updateData).then(({ error }) => {
        if (error) console.error('Failed to sync progress:', error);
      });
    }
    
    return {
      cyberCredits: newCredits,
      completedLevels: {
        ...state.completedLevels,
        [role]: newCompleted
      },
      unlockedLevels: {
        ...state.unlockedLevels,
        [role]: newUnlocked
      },
      campaignComplete: isCampaignWin || state.campaignComplete
    };
  }),
  setUnlockedLevels: (attacker, defender) => set({ 
    unlockedLevels: { attacker, defender } 
  }),
  setCompletedLevels: (attacker, defender) => set({ 
    completedLevels: { 
      attacker: new Set(attacker), 
      defender: new Set(defender) 
    } 
  }),
  setCurrentLevel: (level) => set({ currentLevel: level, missionState: level !== null ? 'briefing' : null }),
  setMissionState: (state) => set({ missionState: state }),
  unlockAllLevels: () => set({
    unlockedLevels: { attacker: 8, defender: 8 },
    completedLevels: { 
      attacker: new Set([1, 2, 3, 4, 5, 6, 7, 8]), 
      defender: new Set([1, 2, 3, 4, 5, 6, 7, 8]) 
    }
  })
}));
