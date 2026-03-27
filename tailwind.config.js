/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050508',
        'neon-cyan': '#00FFD1',
        'neon-orange': '#FF6B35',
        'neon-purple': '#7C6AF7',
        'neon-pink': '#FF3CAC',
        'neon-gold': '#FFD700',
      },
      fontFamily: {
        mono: ['"Courier New"', 'monospace'],
        serif: ['Georgia', 'serif'],
      },
      animation: {
        ticker: 'ticker 30s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease infinite',
        'fade-in-up': 'fadeInUp 0.8s ease forwards',
        scanline: 'scanline 8s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};
