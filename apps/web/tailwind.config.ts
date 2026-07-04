import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface Colors
        surface: '#f9f9ff',
        'surface-dim': '#d3daea',
        'surface-bright': '#f9f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f0f3ff',
        'surface-container': '#e7eefe',
        'surface-container-high': '#e2e8f8',
        'surface-container-highest': '#dce2f3',
        'on-surface': '#151c27',
        'on-surface-variant': '#444654',
        'inverse-surface': '#2a313d',
        'inverse-on-surface': '#ebf1ff',
        'outline': '#747686',
        'outline-variant': '#c4c5d6',
        'surface-tint': '#3052d2',
        'surface-variant': '#dce2f3',

        // Primary Colors
        primary: '#1a40c2',
        'on-primary': '#ffffff',
        'primary-container': '#3b5bdb',
        'on-primary-container': '#e2e5ff',
        'inverse-primary': '#b8c3ff',
        'primary-fixed': '#dde1ff',
        'primary-fixed-dim': '#b8c3ff',
        'on-primary-fixed': '#001355',
        'on-primary-fixed-variant': '#0736ba',

        // Secondary Colors
        secondary: '#006a69',
        'on-secondary': '#ffffff',
        'secondary-container': '#7df5f4',
        'on-secondary-container': '#007070',
        'secondary-fixed': '#7df5f4',
        'secondary-fixed-dim': '#5ed9d7',
        'on-secondary-fixed': '#002020',
        'on-secondary-fixed-variant': '#00504f',

        // Tertiary Colors
        tertiary: '#4b4f59',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#636771',
        'on-tertiary-container': '#e3e6f2',
        'tertiary-fixed': '#dfe2ee',
        'tertiary-fixed-dim': '#c3c6d2',
        'on-tertiary-fixed': '#171c24',
        'on-tertiary-fixed-variant': '#434750',

        // Error/Status Colors
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // Background
        background: '#f9f9ff',
        'on-background': '#151c27',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        'headline-lg': ['Sora', 'sans-serif'],
        'headline-lg-mobile': ['Sora', 'sans-serif'],
        'headline-md': ['Sora', 'sans-serif'],
        'headline-sm': ['Sora', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
        'label-md': ['Inter', 'sans-serif'],
        'label-sm': ['Inter', 'sans-serif'],
        'numeric-table': ['Inter', 'sans-serif'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '56px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.05em' }],
        'numeric-table': ['14px', { lineHeight: '20px', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        base: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        gutter: '24px',
        'margin-mobile': '16px',
        'container-max': '1440px',
      },
      boxShadow: {
        'tonal-1': '0 4px 12px rgba(17, 24, 39, 0.05)',
        'tonal-2': '0 12px 32px rgba(17, 24, 39, 0.1)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
