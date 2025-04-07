/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}", // ← Adjust this based on your file structure
    ],
    theme: {
      extend: {
        animation: {
          blob: "blob 7s infinite",
        },
        keyframes: {
          blob: {
            "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
            "33%": { transform: "translate(30px, -20px) scale(1.1)" },
            "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          },
        },
      },
    },
    plugins: [],
  };
  