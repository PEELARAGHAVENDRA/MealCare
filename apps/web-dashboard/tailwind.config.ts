import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          green: "#17643b",
          saffron: "#f08c21",
          blue: "#1d4e89",
          cream: "#f8faf6"
        }
      }
    }
  },
  plugins: []
};

export default config;
