/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        juw: {
          navy: {
            50: '#f0f4f9',
            100: '#e1e9f2',
            200: '#c2d3e5',
            300: '#94b3d3',
            400: '#5f8ebd',
            500: '#396fa6',
            600: '#27568b',
            700: '#1e4470',
            800: '#1a3a5e',
            900: '#0e233d',
            950: '#081424',
          },
          emerald: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
            950: '#022c22',
          },
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 20px -2px rgba(14, 35, 61, 0.06), 0 2px 6px -1px rgba(14, 35, 61, 0.03)',
        'card-hover': '0 12px 30px -4px rgba(14, 35, 61, 0.12), 0 4px 10px -2px rgba(14, 35, 61, 0.04)',
        'elevated': '0 20px 40px -8px rgba(14, 35, 61, 0.18)',
        'admin-header': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
