/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dungeon: {
          bg: '#1a1a2e',
          panel: '#16213e',
          accent: '#0f3460',
          highlight: '#e94560',
          purple: '#533483',
          gold: '#f5c518',
          dark: '#0d0d1a',
          floor: '#2a2a4a',
          wall: '#4a4a6a',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
