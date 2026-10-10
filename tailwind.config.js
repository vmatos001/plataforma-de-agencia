/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          DEFAULT: '#ff5e00',
          glow: '#ff7722',
        },
        dark: {
          bg: '#080b11',
          card: '#0f141f',
          surface: '#151c2b',
          border: '#1e293b',
          muted: '#2a364f',
        }
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(255, 94, 0, 0.3)',
        'glow-sm': '0 0 15px -3px rgba(255, 94, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
