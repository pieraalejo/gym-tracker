/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:  '#0a0a0a',
        surface:     '#141414',
        surface2:    '#1e1e1e',
        border:      '#2a2a2a',
        accent:      '#39ff14',
        accentDim:   '#2bcc10',
        textPrimary: '#f0f0f0',
        textMuted:   '#888888',
        danger:      '#ef4444',
        warning:     '#f59e0b',
        success:     '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        pixel: ['"Press Start 2P"', 'cursive'],
      },
    },
  },
  plugins: [],
}