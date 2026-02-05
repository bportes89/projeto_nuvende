/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nuvende: {
          black: '#141414',
          dark: '#181818',
          green: '#00C853',
          gray: '#808080',
          light: '#e5e5e5'
        }
      }
    },
  },
  plugins: [],
}