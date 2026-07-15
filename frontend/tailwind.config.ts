import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Background scale ─────────────────────────────── */
        "bg-0":  "var(--bg-0)",
        "bg-1":  "var(--bg-1)",
        "bg-2":  "var(--bg-2)",
        "bg-3":  "var(--bg-3)",

        /* ── Surfaces ─────────────────────────────────────── */
        card:    "var(--card)",
        "card-2":"var(--card-2)",

        /* ── Borders ──────────────────────────────────────── */
        border:    "var(--border)",
        "border-2":"var(--border-2)",

        /* ── Typography ───────────────────────────────────── */
        ink:    "var(--ink)",
        "ink-2":"var(--ink-2)",
        muted:  "var(--muted)",
        faint:  "var(--faint)",

        /* ── Brand / Accent (Green) ───────────────────────── */
        brand:        "var(--brand)",
        "brand-dark": "var(--brand-dark)",
        "brand-light":"var(--brand-light)",
        "brand-tint": "var(--brand-tint)",

        /* ── Semantic ──────────────────────────────────────── */
        success:      "var(--success)",
        "success-bg": "var(--success-bg)",
        warn:         "var(--warn)",
        "warn-bg":    "var(--warn-bg)",
        danger:       "var(--danger)",
        "danger-bg":  "var(--danger-bg)",
        error:        "var(--danger)",

        /* ── Legacy aliases (remote team components) ─────── */
        jade:              "var(--jade)",
        "jade-light":      "var(--jade-light)",
        "jade-tint":       "var(--jade-tint)",
        "jade-tint-border":"var(--jade-tint-border)",
        "jade-dark":       "var(--jade-dark)",
        coral:             "#E85D3A",
        "coral-tint":      "rgba(232,93,58,0.12)",
        "coral-dark":      "#7A2C15",
        gold:              "#C8973A",
        "gold-tint":       "#FEF3C7",
        "gold-dark":       "#854F0B",
        cream:             "#F6FAF7",
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },

      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs:    ["12px", { lineHeight: "16px" }],
        sm:    ["13px", { lineHeight: "20px" }],
        base:  ["15px", { lineHeight: "24px" }],
        lg:    ["17px", { lineHeight: "28px" }],
        xl:    ["20px", { lineHeight: "30px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "38px" }],
      },

      borderRadius: {
        sm:   "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        full: "var(--radius-full)",
      },

      boxShadow: {
        xs:  "var(--shadow-xs)",
        sm:  "var(--shadow-sm)",
        md:  "var(--shadow-md)",
        lg:  "var(--shadow-lg)",
        "brand-sm": "0 2px 8px rgba(22,163,74,0.20)",
        "brand-md": "0 4px 16px rgba(22,163,74,0.25)",
      },

      keyframes: {
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "orbit-cw": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "orbit-ccw": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(-360deg)" },
        },
        "bounce-in": {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "60%":  { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "pulse-brand": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },

      animation: {
        "slide-up":    "slide-up 250ms cubic-bezier(0.4,0,0.2,1) both",
        "slide-down":  "slide-down 250ms cubic-bezier(0.4,0,0.2,1) both",
        "fade-in":     "fade-in 200ms ease both",
        "scale-in":    "scale-in 200ms cubic-bezier(0.4,0,0.2,1) both",
        "orbit-cw":    "orbit-cw 30s linear infinite",
        "orbit-ccw":   "orbit-ccw 30s linear infinite",
        "bounce-in":   "bounce-in 350ms cubic-bezier(0.4,0,0.2,1) both",
        "pulse-brand": "pulse-brand 2s ease-in-out infinite",
      },

      transitionTimingFunction: {
        "spring": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
      },
    },
  },
  plugins: [],
};

export default config;
