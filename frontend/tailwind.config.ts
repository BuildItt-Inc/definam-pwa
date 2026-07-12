import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-0":        "var(--bg-0)",
        "bg-1":        "var(--bg-1)",
        "bg-2":        "var(--bg-2)",
        "bg-3":        "var(--bg-3)",
        card:          "var(--card)",
        "card-2":      "var(--card-2)",
        border:        "var(--border)",
        "border-2":    "var(--border-2)",
        ink:           "var(--ink)",
        "ink-2":       "var(--ink-2)",
        muted:         "var(--muted)",
        faint:         "var(--faint)",
        success:       "var(--success)",
        "success-bg":  "var(--success-bg)",
        warn:          "var(--warn)",
        "warn-bg":     "var(--warn-bg)",
        danger:        "var(--danger)",
        "danger-bg":   "var(--danger-bg)",
        error:         "var(--danger)",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        "dm-sans": ["var(--font-dm-sans)", "sans-serif"],
      },
      keyframes: {
        "orbit-cw": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "orbit-ccw": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(-360deg)" },
        },
      },
      animation: {
        "orbit-cw": "orbit-cw 30s linear infinite",
        "orbit-ccw": "orbit-ccw 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
