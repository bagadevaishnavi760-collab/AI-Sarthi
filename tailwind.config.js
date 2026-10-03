/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F2745',
        primaryDark: '#09182C',
        primaryLight: '#1A3B65',
        secondary: '#2563EB',
        secondaryDark: '#1D4ED8',
        secondaryLight: '#EFF6FF',
        accent: '#C2410C', // restrained saffron — Indian government identity
        accentLight: '#FFF7ED',
        background: '#F8FAFC',
        card: '#FFFFFF',
        cardHover: '#FAFCFF',
        surfaceMuted: '#F1F5F9',
        borderSubtle: '#E2E8F0',
        success: '#10B981',
        warning: '#F59E0B',
        critical: '#EF4444',
        ink: '#0F172A',
        inkLight: '#334155',
        muted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        cardHover: '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
        cardActive: '0 2px 4px 0 rgba(15, 23, 42, 0.04)',
        glow: '0 0 25px -5px rgba(37, 99, 235, 0.2)',
        glowAccent: '0 0 25px -5px rgba(194, 65, 12, 0.2)',
      },
    },
  },
  plugins: [],
}
