/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/js/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6d28d9',
        secondary: '#10b981',
        accent: '#f59e0b',
        darkBg: '#0f172a',
        cardBg: '#1e293b',
        cardHover: '#334155'
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    }
  },
  plugins: [],
}
