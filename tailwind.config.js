/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#FDE2E4',
          yellow: '#FFF5BA',
          green: '#CDEAC0',
          blue: '#D7E3FC',
          purple: '#EADCF8'
        }
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0,0,0,0.05)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem'
      }
    },
  },
  plugins: [],
}

