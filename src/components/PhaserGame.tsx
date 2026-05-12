import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../game/scenes/MainScene';
import { useGameStore } from '../store/gameStore';

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const setCurrentLevel = useGameStore((state) => state.setCurrentLevel);
  const role = useGameStore((state) => state.role);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const unlockedLevels = useGameStore((state) => state.unlockedLevels);
  const completedLevels = useGameStore((state) => state.completedLevels);

  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    if (phaserGameRef.current) {
      return; // Already initialized
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: '100%',
      height: '100%',
      backgroundColor: '#09090b', // match cyber bg
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    // Pass React state to Phaser via registry
    game.registry.set('role', role);
    game.registry.set('unlockedLevels', unlockedLevels);
    game.registry.set('completedLevels', completedLevels);
    game.registry.set('currentLevel', currentLevel);
    game.registry.set('onBuildingClick', (level: number) => {
      setCurrentLevel(level);
    });

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  // Update registry when state changes
  useEffect(() => {
    if (phaserGameRef.current) {
      const registry = phaserGameRef.current.registry;
      registry.set('role', role);
      registry.set('unlockedLevels', unlockedLevels);
      registry.set('completedLevels', completedLevels);
      
      if (currentLevel !== registry.get('currentLevel')) {
        registry.set('currentLevel', currentLevel);
        if (currentLevel !== null) {
          registry.events.emit('zoom_to_building', currentLevel);
        } else {
          registry.events.emit('reset_view');
        }
      }
    }
  }, [role, unlockedLevels, completedLevels, currentLevel]);

  return (
    <div 
      ref={gameRef} 
      className="w-full h-full pointer-events-auto" 
      style={{ touchAction: 'none' }}
    />
  );
}
