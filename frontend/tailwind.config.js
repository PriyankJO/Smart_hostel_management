/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2F172E", // Very dark plum for text
        navy: {
          DEFAULT: "#542A52", // Plum primary
          light: "#7A3D77", // Lighter plum
          soft: "#F4E9F3", // Very light plum for subtle backgrounds
        },
        parchment: "#FFF8F5", // Warm off-white
        card: "#FFFFFF",
        tag: {
          DEFAULT: "#FFB39A", // Peach accent
          dark: "#D96B4E", // Darker peach for text contrast
        },
        ok: "#68A678", // Complimentary green
        warn: "#D95B5B", // Red for errors
        line: "#EADBE6", // Warm grey/plum border
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        tag: "6px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,27,46,0.06), 0 1px 8px rgba(20,27,46,0.05)",
        "card-hover": "0 8px 16px rgba(20,27,46,0.08), 0 2px 8px rgba(20,27,46,0.04)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(15px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
      }
    },
  },
  plugins: [],
}
