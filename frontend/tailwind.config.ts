import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0F1E",
        cream: "#F5F0E8",
        jade: "#1B6B4A",
        gold: "#C8973A",
        coral: "#E85D3A",
        "jade-light": "#5DCAA5",
        "jade-tint": "#EAF3DE",
        "jade-dark": "#085041",
        "jade-darker": "#0F3D2C",
        "gold-tint": "#FEF3C7",
        "gold-dark": "#854F0B",
        "gold-darker": "#412402",
        "coral-tint": "rgba(232,93,58,0.12)",
        "coral-dark": "#7A2C15",
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
