/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // ---- "Trade Navy" design system tokens -------------------------
      // Used by name throughout the app: bg-primary, text-accent, etc.
      colors: {
        primary: {
          DEFAULT: "#1B3A5C", // deep navy — navbar, footer, headers, buttons at rest
          hover: "#15304D", // hover/active state for primary buttons
        },
        accent: {
          DEFAULT: "#F59E0B", // warm amber — primary CTAs, links, active states, badges
        },
        success: {
          DEFAULT: "#15803D", // calm green — verified, delivered, positive confirmations
        },
        danger: {
          DEFAULT: "#DC2626", // errors, cancel/reject, overdue/failed
        },
        background: {
          DEFAULT: "#FFFFFF", // page background
          alt: "#F8FAFC", // alternating sections, card backgrounds
        },
        text: {
          primary: "#0F172A", // body text, headings
          secondary: "#64748B", // meta text, timestamps, placeholders
        },
        border: {
          DEFAULT: "#E2E8F0", // card borders, dividers, input borders
        },
        fill: {
          subtle: "#F1F5F9", // disabled states, subtle chips, table stripe
        },
      },
      fontFamily: {
        // Body default — IBM Plex Sans
        sans: [
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Headings — Fraunces (display serif)
        display: ["Fraunces", "ui-serif", "Georgia", "Cambria", "serif"],
        // Numbers / IDs / prices — IBM Plex Mono
        mono: [
          "IBM Plex Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
