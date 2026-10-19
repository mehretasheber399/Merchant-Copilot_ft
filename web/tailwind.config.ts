import type { Config } from 'tailwindcss';

/**
 * Text contrast, WCAG AA:
 * #FFFFFF on #087A49 = 5.41, #17221C on #F7F9F7 = 15.6,
 * #4E5C54 on #FFFFFF = 7.05, #065F46 on #ECFDF5 = 7.29,
 * #92400E on #FEF3C7 = 6.84, #991B1B on #FEE2E2 = 7.60.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F9F7',
        surface: '#FFFFFF',
        ink: '#17221C',
        muted: '#4E5C54',
        line: '#E1E6E2',
        primary: {
          DEFAULT: '#087A49',
          bright: '#198050',
          soft: '#E8F5EE',
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
        control: '0.75rem',
        card: '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 34, 28, 0.04)',
        shell: '0 9px 25px rgba(8, 122, 73, 0.18)',
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
