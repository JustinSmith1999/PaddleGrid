/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Cinzel', 'Trajan Pro', 'Optima', 'Times New Roman', 'serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        extrabold: '800',
      },
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        // --- Brand: forest green (overrides Tailwind defaults) ---
        green: {
          50:  '#F2F6F3',
          100: '#D9E5DC',
          200: '#B0C6B5',
          300: '#82A48B',
          400: '#54836A',
          500: '#366450',
          600: '#2D4A38',
          700: '#243B2D',
          800: '#1A2C21',
          900: '#111E16',
        },
        emerald: {
          50:  '#F2F6F3',
          100: '#D9E5DC',
          200: '#B0C6B5',
          300: '#82A48B',
          400: '#54836A',
          500: '#366450',
          600: '#2D4A38',
          700: '#243B2D',
          800: '#1A2C21',
          900: '#111E16',
        },
        // --- Brand: antique gold (new palette, additive) ---
        gold: {
          50:  '#FBF8F2',
          100: '#F4ECD9',
          200: '#E6D5B0',
          300: '#D5BC87',
          400: '#C4A370',
          500: '#B59866',
          600: '#9A7F50',
          700: '#7D673F',
          800: '#5E4D30',
          900: '#3F3320',
        },
        // --- Brand: explicit name for components opting in to the new palette ---
        'paddlegrid-green': '#2D4A38',
        'paddlegrid-gold':  '#B59866',
        'paddlegrid-cream': '#EBE4D2',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
