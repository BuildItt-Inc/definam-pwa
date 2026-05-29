import type { Config } from "tailwindcss";
import type { PluginUtils } from "tailwindcss/types/config";

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
      },
      fontFamily: {
        syne: ["Syne", "sans-serif"],
        "dm-sans": ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
