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
          purple: '#6C5CE7',
          pink: '#FD79A8',
          blue: '#0984E3',
          green: '#00B894',
          yellow: '#FDCB6E',
          red: '#D63031',
          dark: '#1E1E2E',
          darker: '#161622',
          surface: '#2B2B3F',
        },
        kahoot: {
          red: '#E21B3C',
          blue: '#1368CE',
          yellow: '#FFA602',
          green: '#26890C',
        }
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 1.5s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'pop-in': 'popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
