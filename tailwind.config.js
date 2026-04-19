/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        agent: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rise: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        modalUp: {
          '0%': { opacity: 0, transform: 'translateY(18px) scale(0.98)' },
          '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        softPulse: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(37,99,235,0)' },
          '50%': { boxShadow: '0 0 28px rgba(56, 189, 248, 0.28)' },
        },
      },
      animation: {
        rise: 'rise 0.35s ease-out',
        modalUp: 'modalUp 0.3s ease-out',
        softPulse: 'softPulse 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

