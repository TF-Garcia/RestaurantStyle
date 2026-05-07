import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15120f',
        espresso: '#231c17',
        cream: '#f8f2e8',
        linen: '#efe4d3',
        gold: '#c89b4f',
        amber: '#e0b15f',
        wine: '#6f2436',
        olive: '#6f7a46',
        sage: '#a4ad7f',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 60px rgba(21, 18, 15, 0.16)',
        glow: '0 14px 40px rgba(200, 155, 79, 0.22)',
      },
    },
  },
  plugins: [],
} satisfies Config;
