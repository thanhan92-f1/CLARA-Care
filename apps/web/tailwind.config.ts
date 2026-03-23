import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f766e",
        danger: "#b91c1c",
        warning: "#d97706"
      }
    }
  },
  plugins: []
};

export default config;
