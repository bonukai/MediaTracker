/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['Roboto Mono'],
    },
    extend: {
      colors: {
        teal: {
          50: '#CEF3E8',
          100: '#BEEEE1',
          200: '#A3E6D6',
          300: '#88DDCC',
          400: '#6ED3C2',
          500: '#55C9B9',
          600: '#36B49F',
          700: '#298F7B',
          800: '#1C6453',
          900: '#103D31',
          950: '#0A2920',
        },
      },
    },
  },
  plugins: [],
};
