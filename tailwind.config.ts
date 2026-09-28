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
    },
  },
  plugins: [],
};

export default config;
