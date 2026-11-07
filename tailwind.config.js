/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#EEF3F9',
          100: '#D5E0EE',
          200: '#A9BFDC',
          300: '#7596C2',
          400: '#4A72A6',
          500: '#2C5487',
          600: '#1E4170',
          700: '#153259',
          800: '#0E2544',
          900: '#0A1B33',
          950: '#06111F',
        },
        graphite: {
          50: '#F5F6F8',
          100: '#E8EAEE',
          200: '#CDD2DB',
          300: '#A3ABB9',
          400: '#78839A',
          500: '#566174',
          600: '#434D5E',
          700: '#343D4C',
          800: '#252D3A',
          900: '#171D27',
        },
        sky: {
          50: '#EFF9FF',
          100: '#D9F0FF',
          200: '#B6E3FF',
          300: '#7DCEFF',
          400: '#3AB4F5',
          500: '#0E97E0',
          600: '#0A78B8',
          700: '#0C5F92',
        },
        success: { 50: '#ECFDF3', 500: '#12B76A', 700: '#067647' },
        warning: { 50: '#FFFAEB', 500: '#F79009', 700: '#B54708' },
        danger: { 50: '#FEF3F2', 500: '#F04438', 700: '#B42318' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 27, 51, 0.06), 0 1px 3px rgba(10, 27, 51, 0.04)',
        lift: '0 12px 32px -12px rgba(10, 27, 51, 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'grow-bar': {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'slide-in': 'slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'grow-bar': 'grow-bar 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
