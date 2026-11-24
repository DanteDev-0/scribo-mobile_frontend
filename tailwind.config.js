/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx}", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#161618",
        surface: "#1a1a1c",
        border: "#2a2a2e",
        accent: "#FF9100",
        danger: "#e65c4f",
      },
    },
  },
  plugins: [],
};
