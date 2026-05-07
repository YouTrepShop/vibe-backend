import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0814',
          soft: '#0f0a1f',
          card: '#15102b',
          glass: 'rgba(22, 16, 45, 0.55)',
        },
        border: {
          DEFAULT: 'rgba(167, 139, 250, 0.12)',
          strong: 'rgba(167, 139, 250, 0.24)',
        },
        text: {
          DEFAULT: '#ECEAF5',
          muted: '#9089b2',
          dim: '#6c648e',
        },
        primary: {
          50: '#f3eefe',
          100: '#e6dafd',
          200: '#cbb4fb',
          300: '#b08ef9',
          400: '#9568f7',
          500: '#7c65d1',
          600: '#684fc4',
          700: '#5440a3',
          800: '#3f3082',
          900: '#2a2161',
          950: '#1a1340',
        },
        accent: {
          pink: '#f472b6',
          cyan: '#22d3ee',
          amber: '#fbbf24',
          emerald: '#34d399',
        },
      },
      borderRadius: {
        DEFAULT: '14px',
        lg: '18px',
        xl: '24px',
        '2xl': '28px',
        '3xl': '32px',
      },
      boxShadow: {
        glass: '0 8px 40px rgba(124, 101, 209, 0.25)',
        glow: '0 0 40px rgba(167, 139, 250, 0.45)',
        soft: '0 4px 24px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'vibe-radial':
          'radial-gradient(1200px 600px at 10% -10%, rgba(124,101,209,0.40), transparent 60%), radial-gradient(900px 500px at 90% 110%, rgba(244,114,182,0.20), transparent 60%), linear-gradient(180deg, #0a0814 0%, #0a0814 60%, #0d0820 100%)',
        'vibe-gradient': 'linear-gradient(135deg, #7c65d1 0%, #b08ef9 60%, #f472b6 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(167,139,250,0.5)' },
          '50%': { boxShadow: '0 0 40px 10px rgba(167,139,250,0.0)' },
        },
        gradientMove: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
        gradientMove: 'gradientMove 12s ease infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
