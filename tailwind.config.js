/** @type {import('tailwindcss').Config} */
const c = (name) => `oklch(var(--${name}-c) / <alpha-value>)`;

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
        border: c('border'),
        input: c('input'),
        ring: c('ring'),
        background: c('background'),
        foreground: c('foreground'),
        surface: c('surface'),
        elevated: c('elevated'),

        /* brand primitives — ink is text/edge, paper is ground */
        ink: c('foreground'),
        paper: c('background'),
        raised: c('elevated'),
        edge: c('edge'),
        stage: c('stage'),

        primary: {
          DEFAULT: c('primary'),
          foreground: c('primary-foreground'),
        },
        secondary: {
          DEFAULT: c('secondary'),
          foreground: c('secondary-foreground'),
        },
        destructive: {
          DEFAULT: c('destructive'),
          foreground: c('destructive-foreground'),
        },
        muted: {
          DEFAULT: c('muted'),
          foreground: c('muted-foreground'),
        },
        accent: {
          DEFAULT: c('accent'),
          foreground: c('accent-foreground'),
        },
        popover: {
          DEFAULT: c('popover'),
          foreground: c('popover-foreground'),
        },
        card: {
          DEFAULT: c('card'),
          foreground: c('card-foreground'),
        },

        /*
         * Text ON a fill. Fixed values — they do not flip with the theme,
         * because "ink on lime" in dark mode is 1.12:1. Use `text-on-candy`
         * on anything lime / cyan / mango / mint / pink.
         */
        'on-candy': c('on-candy'),
        'on-grape': c('on-grape'),
        'on-stage': c('on-stage'),
        'on-danger': c('on-danger'),

        /*
         * The text ramp. Three steps and every one clears WCAG AA on every
         * ground — which is the point. Faking hierarchy with
         * `text-muted-foreground/50` is 2.27:1 on cream: that is not quiet,
         * it is broken. Reach for size and weight instead.
         */
        tertiary: c('text-tertiary'),

        /* The candy, as FILLS. */
        lime: c('lime'),
        amber: c('amber'),
        violet: c('violet'),
        cyan: c('cyan'),
        pink: c('world-arena'),
        grape: c('world-blueprint'),
        mango: c('reward'),
        mint: c('success'),
        chili: c('destructive'),

        /*
         * The candy, as TEXT. Same hue, dark enough to read on cream paper
         * (6.7–7.1:1) and bright enough to read on the night stage.
         * Reach for these whenever a colour carries words.
         */
        'primary-ink': c('primary-ink'),
        'reward-ink': c('reward-ink'),
        'info-ink': c('info-ink'),
        'success-ink': c('success-ink'),
        'violet-ink': c('violet-ink'),
        'danger-ink': c('danger-ink'),
        'lime-ink': c('primary-ink'),
        'mango-ink': c('reward-ink'),
        'cyan-ink': c('info-ink'),
        'mint-ink': c('success-ink'),
        'grape-ink': c('violet-ink'),

        /* The four worlds. One colour each, and that colour is the hat. */
        world: {
          schema: c('world-schema'),
          arena: c('world-arena'),
          dojo: c('world-dojo'),
          blueprint: c('world-blueprint'),
        },
      },

      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '12px',
        lg: '18px',
        xl: '26px',
        '2xl': '32px',
      },

      /* Depth is a second sticker, never a light source. 0 blur, always. */
      boxShadow: {
        none: 'none',
        sm: '2px 2px 0 0 oklch(var(--offset-c))',
        DEFAULT: '4px 4px 0 0 oklch(var(--offset-c))',
        md: '4px 4px 0 0 oklch(var(--offset-c))',
        lg: '6px 6px 0 0 oklch(var(--offset-c))',
        xl: '6px 6px 0 0 oklch(var(--offset-c))',
        '2xl': '8px 8px 0 0 oklch(var(--offset-c))',
        inner: 'none',
        hard: '4px 4px 0 0 oklch(var(--offset-c))',
        'hard-sm': '2px 2px 0 0 oklch(var(--offset-c))',
        'hard-lg': '6px 6px 0 0 oklch(var(--offset-c))',
        'hard-lime': '4px 4px 0 0 oklch(var(--primary-c))',
        'hard-grape': '4px 4px 0 0 oklch(var(--violet-c))',
        'hard-mango': '4px 4px 0 0 oklch(var(--amber-c))',
        'hard-pink': '4px 4px 0 0 oklch(var(--pink-c))',
        'hard-mint': '4px 4px 0 0 oklch(var(--success-c))',
        'hard-cyan': '4px 4px 0 0 oklch(var(--cyan-c))',
      },

      fontFamily: {
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Instrument Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },

      borderWidth: {
        3: '3px',
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
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.92) translateY(6px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
        wiggle: 'wiggle 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
        bob: 'bob 2.4s ease-in-out infinite',
      },

      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
