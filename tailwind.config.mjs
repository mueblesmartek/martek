// tailwind.config.mjs - CONFIGURACIÓN MINIMALISTA CORREGIDA
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      colors: {
        // Paleta minimalista en grises - exacta a nuestro diseño
        primary:  {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Colores de estado minimalistas
        green: {
          500: '#22c55e',
          600: '#16a34a',
        },
        red: {
          500: '#ef4444',
          600: '#dc2626',
        },
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      letterSpacing: {
        'wider': '0.05em',
        'widest': '0.1em',
      },
      lineHeight: {
        '1.2': '1.2',
      },
      aspectRatio: {
        'square': '1 / 1',
        '4/3': '4 / 3',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'spin': 'spin 0.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(10px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        slideUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        spin: {
          'to': { 
            transform: 'rotate(360deg)' 
          },
        },
      },
      transitionDuration: {
        '200': '200ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'out': 'ease-out',
      },
    },
  },
  plugins: [
    // Plugin personalizado para utilidades adicionales
    function({ addUtilities }) {
      addUtilities({
        '.section-padding': {
          'padding-top': '5rem',
          'padding-bottom': '5rem',
          '@media (max-width: 768px)': {
            'padding-top': '3rem',
            'padding-bottom': '3rem',
          },
        },
        '.fade-in': {
          'animation': 'fadeIn 0.6s ease-out',
        },
        '.slide-up': {
          'animation': 'slideUp 0.4s ease-out',
        },
        '.loading': {
          'opacity': '0.6',
          'pointer-events': 'none',
        },
        '.line-clamp-1': {
          'overflow': 'hidden',
          'display': '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          'overflow': 'hidden',
          'display': '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.aspect-square': {
          'aspect-ratio': '1 / 1',
        },
        '.aspect-\\[4\\/3\\]': {
          'aspect-ratio': '4 / 3',
        },
      })
    }
  ],
}