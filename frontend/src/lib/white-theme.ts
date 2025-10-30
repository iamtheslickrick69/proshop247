/**
 * White Theme for ProShop 24/7
 * Linear-inspired minimal design system
 */

export const whiteTheme = {
  // Backgrounds - 99% white/gray
  bg: {
    primary: '#FFFFFF',         // Pure white
    secondary: '#FAFAFA',       // Off-white
    tertiary: '#F5F5F5',        // Light gray
    hover: '#F0F0F0',           // Hover state
  },

  // Borders - Subtle grays
  border: {
    base: '#E5E5E5',            // Default border
    light: '#F0F0F0',           // Lighter border
    medium: '#D4D4D4',          // Medium border
    dark: '#A3A3A3',            // Darker border
  },

  // Text - Dark grays
  text: {
    primary: '#0A0A0A',         // Almost black
    secondary: '#737373',       // Gray
    tertiary: '#A3A3A3',        // Light gray
    placeholder: '#D4D4D4',     // Placeholder
  },

  // Accent Colors - Minimal usage
  accent: {
    blue: '#0066FF',            // Primary blue
    blueHover: '#0052CC',       // Blue hover
    green: '#10B981',           // Success green
    greenLight: '#D1FAE5',      // Light green bg
    red: '#EF4444',             // Error red
    amber: '#F59E0B',           // Warning
  },

  // Shadows - Subtle
  shadow: {
    small: '0 1px 2px rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.07)',
    large: '0 10px 15px rgba(0, 0, 0, 0.08)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
} as const;

export const whiteTypography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

  heading: {
    h1: {
      fontSize: '48px',
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '36px',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.3,
    },
  },

  body: {
    large: {
      fontSize: '18px',
      lineHeight: 1.6,
    },
    regular: {
      fontSize: '16px',
      lineHeight: 1.5,
    },
    small: {
      fontSize: '14px',
      lineHeight: 1.5,
    },
    xs: {
      fontSize: '12px',
      lineHeight: 1.4,
    },
  },
} as const;
