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
        canvas: '#F3EEE6',
        surface: '#FFFCF7',
        ink: '#1C1917',
        muted: '#44403C',
        line: '#8C7B68',
        primary: {
          DEFAULT: '#006B3C',
          bright: '#00A650',
          soft: '#E7F6EE',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#065F46',
          soft: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#92400E',
          soft: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#991B1B',
          soft: '#FEF2F2',
        },
      },
      borderRadius: {
        control: '0.75rem',
        card: '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.06), 0 8px 24px rgba(28, 25, 23, 0.06)',
        shell: '0 0 0 1px rgba(28, 25, 23, 0.06), 0 12px 40px rgba(28, 25, 23, 0.08)',
      },
      fontFamily: {
        sans: ['"Noto Sans Ethiopic"', 'system-ui', 'sans-serif'],
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
