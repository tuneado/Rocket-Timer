/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{html,js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colors (reference design tokens)
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-muted': 'var(--bg-muted)',
        'bg-input': 'var(--bg-input)',
        
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        
        'border-default': 'var(--border-default)',
        'border-muted': 'var(--border-muted)',
        
        // Timer state colors
        'timer-success': 'var(--color-success)',
        'timer-warning': 'var(--color-warning)',
        'timer-danger': 'var(--color-danger)',
        'timer-overtime': 'var(--color-overtime)',
        
        // Primary/brand
        'primary': 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        
        // Legacy support (deprecated - use semantic colors)
        'dark-bg': '#121212',
        'dark-fg': '#f1f1f1',
        'dark-card': '#1e1e1e',
        'dark-border': '#333',
        'light-bg': '#f7f7f7',
        'light-fg': '#333',
        'light-card': '#fff',
        'light-border': '#ddd',
      },
      fontFamily: {
        'ui': ['var(--font-ui)'],
        'mono': ['var(--font-mono)'],
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
      },
      spacing: {
        '0': 'var(--spacing-0)',
        '1': 'var(--spacing-1)',
        '2': 'var(--spacing-2)',
        '3': 'var(--spacing-3)',
        '4': 'var(--spacing-4)',
        '5': 'var(--spacing-5)',
        '6': 'var(--spacing-6)',
        '8': 'var(--spacing-8)',
        '10': 'var(--spacing-10)',
        '12': 'var(--spacing-12)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [],
}

