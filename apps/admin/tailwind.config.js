/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6D28D9',
          purpleDark: '#4C1D95',
          gold: '#F59E0B',
          bg: '#0F172A',
          card: '#1E293B',
        },
      },
    },
  },
  plugins: [],
};

