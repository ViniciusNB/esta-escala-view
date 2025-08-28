/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-custom': 'pulse-custom 5s ease-in-out infinite',
        'pulsar': 'pulse-custom 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-custom': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.4' },
        },
        'pulsar': {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.2' },
        },
      },
    },
  },
  plugins: [],
}