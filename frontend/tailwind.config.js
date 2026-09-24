/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#000000',
        surface: '#121212',
        card: '#181818',
        'card-hover': '#232323',
        raised: '#2a2a2a',
        line: '#282828',
        'line-strong': '#3e3e3e',
        ink: '#ffffff',
        muted: '#b3b3b3',
        subtle: '#8f8f8f',
        accent: {
          DEFAULT: '#1ed760',
          hover: '#3be477',
          soft: '#10321d',
          ink: '#000000',
        },
        warn: '#f5b544',
        danger: '#f3727f',
        bridge: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      fontFamily: {
        sans: ['Figtree', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'Figtree', 'sans-serif'],
      },
      transitionTimingFunction: {
        snappy: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
}
