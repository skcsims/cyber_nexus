import { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'data' | 'explosion' | 'ambient';
}

interface GameCanvasProps {
  color?: string;
  particleCount?: number;
  className?: string;
  effects?: ('ambient' | 'grid' | 'scanline' | 'rain')[];
}

export default function GameCanvas({ color = '#38bdf8', particleCount = 40, className = '', effects = ['ambient'] }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3 - 0.2,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 200,
        size: Math.random() * 2 + 0.5,
        color,
        type: 'ambient'
      });
    }
    particlesRef.current = particles;
  }, [color, particleCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We'll use a global event or a ref to pass bursts to the loop
    const burstParticles: Particle[] = [];

    const handleBurst = (e: any) => {
      const { x, y, color, count = 12 } = e.detail;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 4;
        burstParticles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 30 + Math.random() * 20,
          size: 1 + Math.random() * 2,
          color,
          type: 'explosion'
        });
      }
    };

    window.addEventListener('game-burst', handleBurst);

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        if (particlesRef.current.length === 0) {
          initParticles(canvas.width, canvas.height);
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, w, h);

      // Grid effect
      if (effects.includes('grid')) {
        ctx.strokeStyle = color + '0a';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // Ambient particles
      if (effects.includes('ambient')) {
        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.life++;

          if (p.life > p.maxLife || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
            p.x = Math.random() * w;
            p.y = h + 10;
            p.life = 0;
            p.vx = (Math.random() - 0.5) * 0.5;
            p.vy = -(Math.random() * 0.5 + 0.2);
          }

          const lifeRatio = 1 - (p.life / p.maxLife);
          const alpha = lifeRatio * 0.4 * (0.5 + Math.sin(timeRef.current * 2 + p.x * 0.01) * 0.5);
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();
        }
      }

      // Burst particles
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life++;

        if (p.life > p.maxLife) {
          burstParticles.splice(i, 1);
          continue;
        }

        const alpha = 1 - (p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Extra glow for burst
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 40).toString(16).padStart(2, '0');
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('game-burst', handleBurst);
    };
  }, [color, effects, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
    />
  );
}

export function spawnBurst(_canvas: any, x: number, y: number, color: string, count = 12) {
  window.dispatchEvent(new CustomEvent('game-burst', { detail: { x, y, color, count } }));
}
