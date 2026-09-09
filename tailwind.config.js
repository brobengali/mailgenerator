/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        indigo: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-brand':   '0 0 28px -5px rgba(124,58,237,0.35)',
        'glow-indigo':  '0 0 28px -5px rgba(99,102,241,0.30)',
        'glow-emerald': '0 0 28px -5px rgba(16,185,129,0.30)',
        'card':         '0 4px 24px -4px rgba(124,58,237,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
      },
    },
  },
  plugins: [],
}
