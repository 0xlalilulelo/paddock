/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        f1: "#E10600",
        imsa: "#00A651",
        wec: "#0072CE",
        nascar: "#FFB612",
        background: "#0a0a0a",
        surface: "#111111",
        "surface-raised": "#1a1a1a",
        border: "#2a2a2a",
        "text-primary": "#f5f5f5",
        "text-secondary": "#a3a3a3",
        "text-muted": "#525252",
      },
      fontFamily: {
        sans: ["System", "ui-sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
