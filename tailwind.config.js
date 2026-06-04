/** PaddleGrid brand palette v3 — extracted from the new logo
 *  Forest #16291E + Cream #E5DACE + Taupe #B5A896
 *
 *  We remap green/emerald/teal to the new forest scale so every existing
 *  bg-green-700 / text-emerald-600 reference adopts the new palette
 *  without touching component files.
 */

const forest = {
  50:  '#EEF1EF',
  100: '#D4DCD7',
  200: '#A8B8AE',
  300: '#7D9485',
  400: '#52715C',
  500: '#3A5A45',
  600: '#2A4232',
  700: '#1F3024',
  800: '#162820',
  900: '#0F1B14',
  950: '#0A130D',
};

const cream = {
  50:  '#FAF7F2',
  100: '#F4EDE2',
  200: '#E5DACE',
  300: '#D8C8B6',
  400: '#C6B49C',
  500: '#B5A896',
};

const taupe = {
  50:  '#F5F2EE',
  100: '#E8E1D7',
  200: '#D0C5B5',
  300: '#B5A896',
  400: '#9A8B77',
  500: '#7D6E5C',
  600: '#5F5345',
  700: '#443B30',
};

// Warm slate — replaces cold slate-* with a parchment-leaning neutral.
// Most existing UI uses slate-50..slate-900; we keep the scale names so
// the existing classes look right with the warm cast.
const warmSlate = {
  50:  '#FAF7F2',
  100: '#F2EDE3',
  200: '#E5DDD0',
  300: '#CBBFAE',
  400: '#A89B89',
  500: '#7D6E5C',
  600: '#5F5345',
  700: '#443B30',
  800: '#2E2820',
  900: '#1C1813',
  950: '#0E0B08',
};

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        green:   forest,
        emerald: forest,
        teal:    forest,
        slate:   warmSlate,
        gray:    warmSlate,
        forest,
        cream,
        taupe,
        'paddlegrid-forest': '#16291E',
        'paddlegrid-cream':  '#E5DACE',
        'paddlegrid-taupe':  '#B5A896',
      },
      fontFamily: {
        display: ['Cinzel', '"Trajan Pro"', 'Optima', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'paper': 'radial-gradient(ellipse at top, #F4EDE2 0%, #E5DACE 100%)',
      },
    },
  },
  plugins: [],
};
