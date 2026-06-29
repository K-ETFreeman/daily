/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#f47b3f', // warm orange — brand + timer, used sparingly
        canvas: '#0b0f17', // deep slate / midnight page
        surface: '#121826', // cards / inputs (midnight blue)
        surface2: '#1a2233', // cells / charcoal-slate (miss)
        line: '#2a3346', // bluish hairline borders
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Martian Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        riseIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'riseIn 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
