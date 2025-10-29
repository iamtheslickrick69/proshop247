/**
 * Button Component - Linear Style
 * Minimal white theme with subtle interactions
 */

import React from 'react';
import { colors, borderRadius, shadows, animations } from '../../lib/design-system';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const buttonStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 500,
    borderRadius: borderRadius.base,
    transition: animations.base,
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
  },

  variants: {
    primary: {
      background: colors.accent.blue,
      color: '#FFFFFF',
      '&:hover': {
        background: '#2563EB',
        transform: 'translateY(-1px)',
        boxShadow: shadows.medium,
      },
      '&:active': {
        transform: 'translateY(1px)',
      },
    },

    secondary: {
      background: colors.bg.primary,
      color: colors.text.primary,
      border: `1px solid ${colors.border.base}`,
      '&:hover': {
        background: colors.bg.tertiary,
        borderColor: colors.border.hover,
      },
    },

    ghost: {
      background: 'transparent',
      color: colors.text.secondary,
      '&:hover': {
        background: colors.bg.tertiary,
        color: colors.text.primary,
      },
    },

    danger: {
      background: colors.accent.red,
      color: '#FFFFFF',
      '&:hover': {
        background: '#DC2626',
      },
    },
  },

  sizes: {
    small: {
      padding: '6px 12px',
      fontSize: '12px',
    },
    medium: {
      padding: '8px 16px',
      fontSize: '14px',
    },
    large: {
      padding: '10px 20px',
      fontSize: '16px',
    },
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  style,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = buttonStyles.variants[variant];
  const sizeStyles = buttonStyles.sizes[size];

  const combinedStyle = {
    ...buttonStyles.base,
    ...variantStyles,
    ...sizeStyles,
    ...(disabled && {
      opacity: 0.5,
      cursor: 'not-allowed',
      pointerEvents: 'none' as const,
    }),
    ...style,
  };

  return (
    <button
      style={combinedStyle}
      className={`button button-${variant} button-${size} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
