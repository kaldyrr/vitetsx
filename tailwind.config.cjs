/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="cyber"]'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        accent: 'var(--color-accent)',
        accent2: 'var(--color-accent-2)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
      },
      boxShadow: {
        neon: '0 0 25px rgba(255, 94, 255, 0.35), 0 0 60px rgba(0, 255, 255, 0.2)',
        'neon-strong':
          '0 0 30px rgba(255, 94, 255, 0.45), 0 0 80px rgba(0, 255, 255, 0.35), 0 0 120px rgba(0, 122, 255, 0.25)',
      },
      backgroundImage: {
        'grid-neon':
          'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
