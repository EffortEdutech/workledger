/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main brand color
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        // Contract Type Colors
        contract: {
          pmc: '#3b82f6',      // Blue - Preventive
          cmc: '#8b5cf6',      // Purple - Comprehensive
          amc: '#10b981',      // Green - Annual
          sla: '#ef4444',      // Red - SLA (critical)
          corrective: '#f97316', // Orange - Breakdown
          emergency: '#dc2626',  // Dark Red - Emergency
          t_and_m: '#eab308',    // Yellow - Time & Material
          construction: '#6366f1' // Indigo - Construction
        },
        // Status Colors
        status: {
          draft: '#6b7280',       // Gray
          submitted: '#3b82f6',   // Blue
          approved: '#10b981',    // Green
          rejected: '#ef4444'     // Red
        },
        // Offline Indicators
        offline: {
          pending: '#f59e0b',     // Amber - pending sync
          syncing: '#3b82f6',     // Blue - syncing
          synced: '#10b981',      // Green - synced
          failed: '#ef4444',      // Red - failed
          conflict: '#f97316'     // Orange - conflict
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Fira Code', 'Monaco', 'Consolas', 'monospace']
      },
      spacing: {
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem'
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem'
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'bounce-slow': 'bounce 2s infinite'
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      }
    }
  },
  plugins: [
    // Add forms plugin for better form styling
    require('@tailwindcss/forms')({
      strategy: 'class' // Use 'form-input', 'form-select' etc.
    }),
    // Add line-clamp plugin
    require('@tailwindcss/line-clamp'),
    // Custom utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-default': {
          '-ms-overflow-style': 'auto',
          'scrollbar-width': 'auto',
          '&::-webkit-scrollbar': {
            display: 'block'
          }
        }
      }
      addUtilities(newUtilities)
    }
  ]
}
