import { transform } from 'typescript';

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
        'pulsar': 'pulsar 3s ease-in-out infinite',
        'expandir': 'expandir 0.6s ease-in-out',
        'escalaHorizontal': 'escalaHorizontal 1s ease-in-out',
        'escalaH': 'escalaH 0.4s ease',
        'escalaV': 'escalaV 0.5s ease-in-out',
        'slideLeft': 'slideLeft 0.5s ease-in-out forwards',
        'slideRight': 'slideRight 0.5s ease-in-out forwards',
        'slideLeftDuration': 'slideLeftDuration 0.9s ease-in-out forwards',
        'slideRightDuration': 'slideRightDuration 0.9s ease-in-out forwards',
        'slideDown': 'slideDown 0.9s ease-in-out forwards',
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
        'expandir': {
          '0%': { transform: 'translateY(-40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'escalaHorizontal': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'escalaH': {
          '0%': { transform: 'scaleX(0)',},
          '100%': { transform: 'scaleX(1)',},
        },
        'escalaV': {
          '0%': { transform: 'scaleX(0.5) scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1) scaleY(1)', opacity: '1' },
        },
        'slideLeft': {
          '0%': { transform: 'translateX(-200px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slideRight': {
          '0%': { transform: 'translateX(200px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slideDown': {
          '0%': { transform: 'translateY(-50px)', },
          '100%': { transform: 'translateY(0)', },
        },
        'slideLeftDuration': {
          '0%': { transform: 'translateX(-100px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slideRightDuration': {
          '0%': { transform: 'translateX(100px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    }
  },
  plugins: [],
}