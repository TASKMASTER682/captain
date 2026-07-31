/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // toggled via a `dark` class on <html> — see providers/ThemeProvider.jsx
  content: ['./src/app/**/*.{js,jsx}', './src/components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        border: 'var(--border)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        violet: { DEFAULT: 'var(--violet)', soft: 'var(--violet-soft)' },
        teal: { DEFAULT: 'var(--teal)', soft: 'var(--teal-soft)' },
        amber: { DEFAULT: 'var(--amber)', soft: 'var(--amber-soft)' },
        coral: { DEFAULT: 'var(--coral)', soft: 'var(--coral-soft)' },
        blue: { DEFAULT: 'var(--blue)', soft: 'var(--blue-soft)' },
      },
      fontFamily: {
        display: ['var(--font-manrope)', 'ui-sans-serif', 'sans-serif'],
        body: ['var(--font-inter)', 'ui-sans-serif', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: 'var(--shadow)',
      },
    },
  },
  plugins: [],
};
