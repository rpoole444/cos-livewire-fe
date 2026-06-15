import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    darkMode: false,
    extend: {
      fontFamily: {
        sans: ["Lato", "Inter", "system-ui", "sans-serif"],
        display: ["Cinzel", "Cormorant Garamond", "Georgia", "serif"]
      },
      colors: {
        black: "#0B0C09",
        gold: "#C9962E",
        "sun-gold": "#E0B861",
        ivory: "#F4E7B8",
        copper: "#B86432",
        alpine: "#4F7870",
        pine: "#263F38",
        mist: "#F3DFA6"
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      }
    }
  },
  plugins: []
};

export default config;
