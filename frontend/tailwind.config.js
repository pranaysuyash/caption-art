/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map existing CSS variables if needed, or just use Tailwind defaults for now
        // We can extend this later based on design-system.css
      }
    },
  },
  plugins: [],
}
