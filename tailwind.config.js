/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(56,189,248,0.4), 0 0 60px rgba(56,189,248,0.15)',
        'neon-red': '0 0 20px rgba(255,59,59,0.4), 0 0 60px rgba(255,59,59,0.15)',
        'neon-green': '0 0 20px rgba(74,222,128,0.4), 0 0 60px rgba(74,222,128,0.15)',
        'neon-purple': '0 0 20px rgba(192,132,252,0.4), 0 0 60px rgba(192,132,252,0.15)',
        'inner-glow': 'inset 0 0 30px rgba(255,255,255,0.03)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'border-trace': 'border-trace 3s linear infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'radar': 'radar-sweep 4s linear infinite',
      },
    },
  },
  plugins: [],
}
