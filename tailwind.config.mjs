/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#121110',
          darker: '#0a0908',
          card: '#1a1917',
          light: '#f9f8f5',
          muted: '#ede8df',
          cream: '#f4f0e8',
          gold: '#c8a97e',
          'gold-light': '#dfc9a8',
          'gold-dark': '#a9875c',
          text: '#1c1917',
          'text-muted': '#57534e',
          'text-light': '#9ca3af',
          border: '#e2ddd3',
          'border-dark': '#2a2724',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'luxury': '0 20px 40px -15px rgba(18, 17, 16, 0.08)',
        'luxury-hover': '0 30px 60px -15px rgba(18, 17, 16, 0.14)',
        'gold-glow': '0 0 25px rgba(200, 169, 126, 0.25)',
      }
    },
  },
  plugins: [],
}
