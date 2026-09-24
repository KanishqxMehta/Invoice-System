import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cafe: {
          50: "#faf6f0",
          100: "#f4ecdf",
          200: "#e8d7be",
          300: "#d9bc97",
          400: "#c79e6f",
          500: "#b8834c",
          600: "#a26a3c",
          700: "#804f32",
          800: "#68402d",
          900: "#563628",
          950: "#311c14",
        },
      },
    },
  },
  plugins: [],
};

export default config;
