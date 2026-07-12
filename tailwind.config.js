/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3EC',
        canvas: '#FBF8F2',
        charcoal: '#1E1B18',
        ink: '#2A2622',
        stone: '#6B6357',
        mist: '#9A9186',
        line: '#E3DBCF',
        gold: '#B08A4F',
        goldsoft: '#C9AE7E',
        bronze: '#8A6D3B',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(30,27,24,0.04), 0 8px 24px rgba(30,27,24,0.06)',
        lift: '0 4px 12px rgba(30,27,24,0.08), 0 18px 40px rgba(30,27,24,0.10)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
        fadeIn: 'fadeIn 0.4s ease both',
        scaleIn: 'scaleIn 0.35s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
