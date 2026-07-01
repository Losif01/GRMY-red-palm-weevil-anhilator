/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'palm-dark': '#064e3b',
        'palm-main': '#059669',
        'palm-light': '#d1fae5',
      },
      animation: {
        'float': 'float 15s ease-in-out infinite',
        'float-delayed': 'float 18s ease-in-out infinite reverse',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(20px, -20px) rotate(5deg)' },
        },
      },
    },
  },
  plugins: [],
}