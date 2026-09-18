/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#4F46E5", dark: "#4338CA", light: "#EEF2FF" },
        secondary: { DEFAULT: "#7C3AED", light: "#F5F3FF" },
        surface: "#F8FAFC",
        ink: "#0F172A",
        success: { DEFAULT: "#16A34A", light: "#DCFCE7" },
        warning: { DEFAULT: "#F59E0B", light: "#FEF3C7" },
        danger: { DEFAULT: "#DC2626", light: "#FEE2E2" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.12)",
        pop: "0 12px 40px -12px rgba(15,23,42,0.25)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { "fade-in": "fade-in .18s ease-out" },
    },
  },
  plugins: [],
};
