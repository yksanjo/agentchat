/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      
      /* Design Token Extensions */
      spacing: {
        '4.5': '18px',
        '5.5': '22px',
      },
      
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      
      colors: {
        /* shadcn/ui base colors */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        /* Custom AgentChat Colors */
        lobster: {
          DEFAULT: '#ff5722',
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffcdc0',
          300: '#ffaa95',
          400: '#ff7d5c',
          500: '#ff5722',
          600: '#f04d1a',
          700: '#d43d12',
          800: '#a83011',
          900: '#7c2b13',
        },
        
        /* Background Scale */
        'bg-primary': '#09090b',
        'bg-secondary': '#18181b',
        'bg-tertiary': '#27272a',
        'bg-elevated': '#3f3f46',
        
        /* Status Colors */
        status: {
          online: '#22c55e',
          away: '#fbbf24',
          busy: '#ef4444',
          offline: '#71717a',
        },
      },
      
      boxShadow: {
        'glow': '0 0 20px rgba(255, 87, 34, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 87, 34, 0.5)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 10px 30px rgba(0, 0, 0, 0.4)',
      },
      
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-lobster': 'linear-gradient(135deg, #ff5722 0%, #ff8a65 100%)',
      },
      
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
