/** @type {import('tailwindcss').Config} */

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cfx-box': 'rgba(var(--cfx-box))',
        'cfx-input': 'rgba(var(--cfx-input))'
      }
    }
  },
  plugins: [],
}

