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
      black: "#0f0f0e",
      white: "#FFFCF2",
      accent: "#EB5E28",
      light: "#CCC5B9",
      medium: "#403D39",
      dark: "#252422",
      danger: "#ff0000",
    },
  },
  plugins: [],
}
