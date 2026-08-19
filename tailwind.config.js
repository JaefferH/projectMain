/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#064e3b', // Deep Emerald Green
          light: '#0a6c53',
          dark: '#033326',
        },
        secondary: {
          DEFAULT: '#d4af37', // Luxury Soft Gold
          light: '#e0c25c',
          dark: '#aa8b2b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'Cairo', 'sans-serif'],
      },
      backgroundImage: {
        'islamic-pattern': "url('/pattern.png')",
      }
    },
  },
  plugins: [],
}
