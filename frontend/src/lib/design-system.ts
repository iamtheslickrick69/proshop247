/**
 * ProShop 24/7 Design System
 * Starlink-inspired space-tech dark theme
 */

export const colors = {
  // Backgrounds - STARLINK DARK
  bg: {
    primary: '#000000',      // Pure black - main canvas
    secondary: '#0A0A0A',    // Subtle lift - sidebars
    tertiary: '#111111',     // Elevated surfaces
    card: '#1A1A1A',         // Card backgrounds
  },

  // Borders - Subtle dark grays
  border: {
    base: '#222222',         // Default border
    hover: '#333333',        // Interactive hover
    focus: '#0066FF',        // Starlink blue - focus
  },

  // Text - White and grays
  text: {
    primary: '#FFFFFF',      // Pure white - headings
    secondary: '#B3B3B3',    // Light gray - body
    tertiary: '#666666',     // Muted gray - metadata
  },

  // Accent Colors - Starlink palette
  accent: {
    blue: '#0066FF',         // Starlink blue - primary
    cyan: '#00D9FF',         // Bright cyan - highlights
    green: '#00FF85',        // Success states
    amber: '#FFB800',        // Warnings
    red: '#FF3B30',          // Errors
    purple: '#8B7FFF',       // Special tags
  },

  // Status Pills - Dark theme optimized
  status: {
    active: { bg: '#00FF8520', text: '#00FF85' },      // Live
    booking: { bg: '#0066FF20', text: '#00D9FF' },     // Booked
    answered: { bg: '#33333320', text: '#B3B3B3' },    // Answered
    missed: { bg: '#FF3B3020', text: '#FF3B30' },      // Missed
    pending: { bg: '#FFB80020', text: '#FFB800' },     // Processing
  },
} as const;

export const typography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

  // Headings
  titleLarge: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },

  titleMedium: {
    fontSize: '20px',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
  },

  titleSmall: {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '-0.015em',
    lineHeight: 1.4,
  },

  // Body
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },

  // Small
  small: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.4,
  },

  // Micro (labels, uppercase tags)
  micro: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
} as const;

export const spacing = {
  0: '0px',
  1: '4px',    // Micro
  2: '8px',    // Small
  3: '12px',   // Medium
  4: '16px',   // Large
  6: '24px',   // XL
  8: '32px',   // 2XL
  12: '48px',  // 3XL
  16: '64px',  // 4XL
} as const;

export const layout = {
  sidebarWidth: '240px',
  topBarHeight: '60px',
  maxContentWidth: '1440px',
} as const;

export const borderRadius = {
  small: '4px',
  base: '6px',
  large: '8px',
  xl: '12px',
} as const;

export const shadows = {
  small: '0 2px 8px rgba(0, 102, 255, 0.05)',
  medium: '0 4px 16px rgba(0, 102, 255, 0.08)',
  large: '0 8px 32px rgba(0, 102, 255, 0.12)',
  focus: '0 0 0 2px rgba(0, 102, 255, 0.3)',
  glow: '0 0 40px rgba(0, 102, 255, 0.2)',
} as const;

export const animations = {
  fast: '100ms ease',
  base: '150ms ease',
  slow: '300ms ease',
} as const;

export const breakpoints = {
  mobile: '640px',
  tablet: '1024px',
  desktop: '1440px',
} as const;
