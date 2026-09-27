/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./public/**/*.html",
    "./test/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        hyperlink: {
          dark: '#0a0e18',
          glass: 'rgba(10, 14, 24, 0.88)',
          accent: '#06b6d4',
          glow: 'rgba(6, 182, 212, 0.25)'
        }
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.15s ease-out'
      }
    },
  },
  plugins: [],
}
