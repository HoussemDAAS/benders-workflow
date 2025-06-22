/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your custom color palette
        primary: {
          DEFAULT: '#04082e', // Midnight Navy
          50: '#f8f9ff',
          100: '#e6e8ff',
          200: '#d1d5ff',
          300: '#b3b9ff',
          400: '#8b92ff',
          500: '#5b63ff',
          600: '#3d44ff',
          700: '#2b30e8',
          800: '#1f24b8',
          900: '#04082e',
          950: '#020416',
        },
        accent: {
          DEFAULT: '#030d54', // Royal Navy
          50: '#f4f6ff',
          100: '#e8ecff',
          200: '#d6ddff',
          300: '#b9c4ff',
          400: '#95a1ff',
          500: '#6f7cff',
          600: '#5258ff',
          700: '#3c42e8',
          800: '#2f34b8',
          900: '#030d54',
          950: '#01062b',
        },
        secondary: {
          DEFAULT: '#0055ff', // Electric Blue
          50: '#eff8ff',
          100: '#dbeffe',
          200: '#bfe3ff',
          300: '#93d3ff',
          400: '#60baff',
          500: '#3a9eff',
          600: '#0055ff',
          700: '#0b5bff',
          800: '#1049cd',
          900: '#1340a0',
          950: '#112861',
        },
        tertiary: {
          DEFAULT: '#2de6c7', // Mint Cyan
          50: '#f0fffe',
          100: '#ccfffe',
          200: '#99fffc',
          300: '#5cfff9',
          400: '#2de6c7',
          500: '#14d5ae',
          600: '#0aaa8d',
          700: '#0e8872',
          800: '#12695c',
          900: '#15564d',
          950: '#053330',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      spacing: {
        '18': '4.5rem',
        '70': '17.5rem',
      }
    },
  },
  plugins: [],
}