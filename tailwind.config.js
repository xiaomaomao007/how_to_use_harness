/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "gh-dark": "#0d1117",
        "gh-border": "#30363d",
        "gh-text": "#c9d1d9",
        "gh-text-secondary": "#8b949e",
        "gh-accent": "#58a6ff",
        "gh-success": "#3fb950",
        "gh-warning": "#d29922",
        "gh-danger": "#f85149",
        "gh-card": "#161b22",
        "gh-card-hover": "#1c2129",
      },
    },
  },
  plugins: [],
};
