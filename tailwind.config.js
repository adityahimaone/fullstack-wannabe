/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'oklch(var(--border-c) / <alpha-value>)',
        input: 'oklch(var(--input-c) / <alpha-value>)',
        ring: 'oklch(var(--ring-c) / <alpha-value>)',
        background: 'oklch(var(--background-c) / <alpha-value>)',
        foreground: 'oklch(var(--foreground-c) / <alpha-value>)',
        surface: 'oklch(var(--surface-c) / <alpha-value>)',
        elevated: 'oklch(var(--elevated-c) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary-c) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground-c) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary-c) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground-c) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive-c) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground-c) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted-c) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground-c) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent-c) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground-c) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover-c) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground-c) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'oklch(var(--card-c) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground-c) / <alpha-value>)',
        },
        lime: 'oklch(var(--lime-c) / <alpha-value>)',
        amber: 'oklch(var(--amber-c) / <alpha-value>)',
        violet: 'oklch(var(--violet-c) / <alpha-value>)',
        cyan: 'oklch(var(--cyan-c) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Instrument Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-line': {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translate(-50%, -50%) scale(0.97)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
