/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#e0703a', // restrained orange, used sparingly
        canvas: '#15161a', // page background — dark but lifted off pure black
        surface: '#1e2026', // cards / inputs
        surface2: '#282a32', // tiles / hovered rows
        line: '#34363f', // visible hairline borders
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Martian Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
