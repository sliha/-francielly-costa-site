import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'rose-gold': '#B76E79',
        'rose-gold-light': '#D4A0A8',
        'rose-gold-dark': '#8E4F58',
        'golden': '#C9A96E',
        'golden-light': '#E2C99A',
        'golden-dark': '#A07840',
        'cream': '#FDF8F5',
        'cream-dark': '#F5EDE6',
        'dark-bg': '#1A1A1A',
        'dark-card': '#252525',
        'text-primary': '#333333',
        'text-secondary': '#666666',
        'text-muted': '#999999',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        inter: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-rose': 'linear-gradient(135deg, #B76E79 0%, #C9A96E 100%)',
        'gradient-rose-soft': 'linear-gradient(135deg, rgba(183,110,121,0.1) 0%, rgba(201,169,110,0.1) 100%)',
        'gradient-hero': 'linear-gradient(to bottom, rgba(26,26,26,0.3) 0%, rgba(26,26,26,0.6) 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.6s ease-out forwards',
        'slide-in-right': 'slideInRight 0.6s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'count-up': 'countUp 2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'rose': '0 4px 20px rgba(183, 110, 121, 0.3)',
        'rose-lg': '0 8px 40px rgba(183, 110, 121, 0.4)',
        'golden': '0 4px 20px rgba(201, 169, 110, 0.3)',
        'card': '0 2px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.15)',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}

export default config
