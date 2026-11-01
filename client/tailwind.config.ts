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
          canvas: '#08090c',       // Deepest obsidian background
          surface: '#0f1015',      // Sidebar and secondary panels
          card: '#14151d',         // Elevated cards and containers
          cardHover: '#1a1b26',    // Card hover state
          subtle: '#1d1e2a',       // Inactive buttons and input backgrounds
          border: 'rgba(255, 255, 255, 0.07)',      // Hairline borders
          borderStrong: 'rgba(255, 255, 255, 0.14)',// Active/hover borders
          accent: '#6366f1',       // Electric Indigo
          accentHover: '#4f46e5',
          accentGlow: 'rgba(99, 102, 241, 0.25)',
          violet: '#8b5cf6',
          textMain: '#f9fafb',     // Bright header text
          textMuted: '#9ca3af',    // Primary body text
          textDim: '#6b7280',      // Metadata, labels, timestamps
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.25)',
        card: '0 2px 8px -2px rgba(0, 0, 0, 0.5), 0 1px 4px -1px rgba(255, 255, 255, 0.03) inset',
      },
    },
  },
  plugins: [],
};

export default config;
