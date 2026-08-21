/** @type {import('tailwindcss').Config} */

/**
 * SafarAI Design System — Tailwind theme
 * ------------------------------------------------------------------
 * Colour model:
 *  • Static brand scales (brand / accent / gold) keep product identity.
 *  • Semantic tokens (canvas / surface / line / fg) are CSS variables so
 *    light + dark themes are a single source of truth.
 */
const withOpacity = (variable) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `rgb(var(${variable}))`
    : `rgb(var(${variable}) / ${opacityValue})`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // Semantic, theme-aware tokens
        canvas: withOpacity('--c-canvas'),
        surface: {
          DEFAULT: withOpacity('--c-surface'),
          muted: withOpacity('--c-surface-muted'),
          raised: withOpacity('--c-surface-raised'),
        },
        line: {
          DEFAULT: withOpacity('--c-line'),
          strong: withOpacity('--c-line-strong'),
        },
        fg: {
          DEFAULT: withOpacity('--c-fg'),
          muted: withOpacity('--c-fg-muted'),
          subtle: withOpacity('--c-fg-subtle'),
        },
        ink: withOpacity('--c-fg'),
        mist: withOpacity('--c-surface-muted'),
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Manrope', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Sora', '"Plus Jakarta Sans"', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xs: '0.375rem',
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        md: '0.875rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
        sm: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        card: '0 2px 4px -2px rgb(15 23 42 / 0.06), 0 12px 28px -18px rgb(15 23 42 / 0.35)',
        lift: '0 8px 16px -8px rgb(15 23 42 / 0.14), 0 24px 48px -24px rgb(49 46 129 / 0.45)',
        panel: '0 22px 44px -28px rgb(15 23 42 / 0.28)',
        float: '0 10px 30px -14px rgb(79 70 229 / 0.42)',
        glow: '0 0 0 1px rgb(99 102 241 / 0.16), 0 18px 40px -20px rgb(79 70 229 / 0.55)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        112: '28rem',
        128: '32rem',
      },
      maxWidth: {
        content: '78rem',
      },
      backgroundImage: {
        'hero-grid': 'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.22) 1px, transparent 0)',
        'dot-grid': 'radial-gradient(circle at 1px 1px, rgb(99 102 241 / 0.18) 1px, transparent 0)',
        'brand-gradient': 'linear-gradient(120deg, #4f46e5 0%, #6366f1 45%, #06b6d4 100%)',
        'sunset-gradient': 'linear-gradient(120deg, #f59e0b 0%, #ef4444 55%, #a855f7 100%)',
        shimmer:
          'linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.45) 50%, transparent 100%)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(1.5deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.45' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-down': 'slide-down 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.24, 0, 0.38, 1) infinite',
        marquee: 'marquee 38s linear infinite',
        'gradient-pan': 'gradient-pan 12s ease infinite',
        'bounce-dot': 'bounce-dot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
