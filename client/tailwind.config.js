/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ligRed: {
          DEFAULT: '#D62329', // LIG Sigorta Logosu ana kırmızısı
          dark: '#A31B20',    // Hover için koyu ton
          light: '#FFEBEC'    // Arka plan için açık ton
        }
      }
    },
  },
  plugins: [],
}