import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        workspace: {
          canvas: '#07080b',       // Ultra-deep matte obsidian
          rail: '#0b0c10',         // Far-left icon dock
          sidebar: '#101117',      // Secondary navigation panel
          card: '#13141d',         // Card surfaces
          cardHover: '#181926',    // Card hover state
          elevated: '#1a1b29',     // Popovers, modals, dropdowns
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: 'rgba(255, 255, 255, 0.04)',
          borderStrong: 'rgba(255, 255, 255, 0.16)',
          accent: '#6366f1',       // Electric Indigo
          accentHover: '#4f46e5',
          accentGlow: 'rgba(99, 102, 241, 0.25)',
          purple: '#8b5cf6',
          textMain: '#f9fafb',
          textMuted: '#9ca3af',
          textDim: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 30px -5px rgba(99, 102, 241, 0.3)',
        purpleGlow: '0 0 30px -5px rgba(139, 92, 246, 0.3)',
        card: '0 2px 8px -2px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.06) inset',
        panel: '0 12px 40px -10px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.08) inset',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
