/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0e1a',
          surface: '#111827',
          border: '#1e2d45',
          accent: '#00d4aa',
          accentDim: '#00a882',
          up: '#22c55e',
          down: '#ef4444',
          upBg: 'rgba(34, 197, 94, 0.1)',
          downBg: 'rgba(239, 68, 68, 0.1)',
          text: '#e2e8f0',
          muted: '#64748b',
          dim: '#374151',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
};
