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
          bg: '#0d0e11',
          sidebar: '#121318',
          card: '#16171d',
          cardHover: '#1c1e26',
          border: '#262833',
          borderSubtle: '#1f2029',
          accent: '#6366f1',
          accentHover: '#4f46e5',
          textMain: '#f3f4f6',
          textMuted: '#9ca3af',
          textDim: '#6b7280',
        },
      },
    },
  },
  plugins: [],
};

export default config;
