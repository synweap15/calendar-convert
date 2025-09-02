/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#ffffff',
        fg: '#0f172a',
        muted: '#64748b',
        accent: '#2563eb',
        grid: '#e2e8f0',
      },
    },
  },
  plugins: [],
};
