import type { Config } from 'tailwindcss';

/**
 * Text contrast against the warm surfaces, WCAG AA:
 * #FFFFFF on #006B3C = 6.63, #1C1917 on #F3EEE6 = 15.14,
 * #44403C on #F3EEE6 = 8.89, #065F46 on #ECFDF5 = 7.29,
 * #92400E on #FFFBEB = 6.84, #991B1B on #FEF2F2 = 7.60.
 * Brand #00A650 is 3.20 on white, so it is not used for small text.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F7F6',
        surface: '#FFFFFF',
        ink: '#0F1F17',
        muted: '#5B6B63',
        line: '#E3EAE6',
        primary: {
          DEFAULT: '#006B3C',
          bright: '#00A650',
          soft: '#E8F7EF',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#065F46',
          soft: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#92400E',
          soft: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#991B1B',
          soft: '#FEE2E2',
        },
      },
      borderRadius: {
        control: '1rem',
        card: '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 31, 23, 0.04), 0 8px 24px -8px rgba(15, 31, 23, 0.12)',
        shell: '0 12px 32px -8px rgba(0, 107, 60, 0.35)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '"Noto Sans Ethiopic"', 'sans-serif'],
      },
      minHeight: {
        control: '48px',
        nav: '56px',
      },
      height: {
        nav: '56px',
      },
    },
  },
  plugins: [],
};

export default config;
