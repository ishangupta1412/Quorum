import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: "#000000",
        surface: {
          DEFAULT: "#080C14",
          raised: "#0D1220",
          sunken: "#04070C",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          bold: "rgba(255, 255, 255, 0.16)",
        },
        severity: {
          low: "#64748B",
          medium: "#F59E0B",
          high: "#EF4444",
          critical: "#DC2626",
        },
        status: {
          resolved: "#10B981",
        }
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.85rem", { lineHeight: "1.3rem" }],
        sm: ["0.95rem", { lineHeight: "1.45rem" }],
        base: ["1.05rem", { lineHeight: "1.65rem" }],
        lg: ["1.2rem", { lineHeight: "1.75rem" }],
        xl: ["1.35rem", { lineHeight: "1.85rem" }],
        '2xl': ["1.65rem", { lineHeight: "2.1rem" }],
        '3xl': ["2.1rem", { lineHeight: "2.4rem" }],
        '4xl': ["2.6rem", { lineHeight: "2.8rem" }],
        '5xl': ["3.4rem", { lineHeight: "3.6rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
