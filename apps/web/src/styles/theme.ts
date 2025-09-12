export const theme = {
  colors: {
    primary: {
      dark: '#1a1a1a',      // Deep black for backgrounds
      charcoal: '#2d2d2d',  // Charcoal for cards/sections
      gold: '#d4af37',      // Italian gold accent
      crimson: '#8b0000',   // Deep red for danger/warnings
      wine: '#722f37',      // Wine red for subtle accents
    },
    neutral: {
      white: '#ffffff',
      cream: '#f5f5dc',     // Cream for text on dark
      silver: '#c0c0c0',    // Silver for secondary text
      smoke: '#4a4a4a',     // Smoke gray for borders
      ash: '#696969',       // Ash gray for disabled states
    },
    semantic: {
      success: '#228b22',   // Forest green
      warning: '#ff8c00',   // Dark orange
      error: '#dc143c',     // Crimson
      info: '#4682b4',      // Steel blue
    }
  },
  
  typography: {
    fontFamily: {
      primary: "'Playfair Display', 'Times New Roman', serif", // Elegant serif for headings
      secondary: "'Crimson Text', Georgia, serif",              // Readable serif for body
      accent: "'Cinzel', serif",                               // Decorative for special elements
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },

  borders: {
    radius: {
      none: '0',
      sm: '0.125rem',   // 2px
      md: '0.375rem',   // 6px
      lg: '0.5rem',     // 8px
      xl: '0.75rem',    // 12px
      full: '9999px',
    },
    width: {
      thin: '1px',
      normal: '2px',
      thick: '3px',
    }
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(212, 175, 55, 0.3)', // Gold glow
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  layout: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    container: {
      padding: '1rem',
    }
  }
} as const;

export type Theme = typeof theme;