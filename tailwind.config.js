/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface:  { DEFAULT: '#111118', 50: '#1a1a27', 100: '#16161f', 200: '#0f0f16', 300: '#0a0a0f' },
        border:   { DEFAULT: '#1e1e2e', light: '#2a2a3e' },
        primary:  { DEFAULT: '#6366f1', hover: '#4f46e5', light: '#818cf8' },
        success:  { DEFAULT: '#10b981', bg: '#052e16' },
        warning:  { DEFAULT: '#f59e0b', bg: '#451a03' },
        danger:   { DEFAULT: '#ef4444', bg: '#450a0a' },
        muted:    '#64748b',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-in':   'fadeIn 0.25s ease-out',
        'slide-up':  'slideUp 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.5s infinite',
        'shimmer':   'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { transform: 'translateY(12px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        shimmer:  { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
