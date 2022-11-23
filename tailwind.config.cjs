/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,svelte}",
  ],
  theme: {
    extend: {},
    colors: {
      transparent: "transparent",
      black: "#252422",
      white: "#FFFCF2",
      accent: "#EB5E28",
      light: "#CCC5B9",
      dark: "#403D39",
    },
  },
  plugins: [],
}
