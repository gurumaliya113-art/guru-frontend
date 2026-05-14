/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f8fafc",
        fg: "#0f172a",
        card: "#ffffff",
        muted: "#f1f5f9",
        mutedfg: "#64748b",
        border: "#e2e8f0",
        primary: "#2563eb",
        destructive: "#ef4444",
        neet: "#16a34a",
        neetLight: "#dcfce7",
        neetFg: "#14532d",
        jee: "#ea580c",
        jeeLight: "#ffedd5",
        jeeFg: "#7c2d12",
        board: "#7c3aed",
        boardLight: "#ede9fe",
        warning: "#f59e0b",
        info: "#3b82f6",
        physics: "#3b82f6",
        chemistry: "#8b5cf6",
        biology: "#22c55e",
        mathematics: "#f59e0b",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
