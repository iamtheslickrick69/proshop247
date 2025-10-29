/**
 * Input Component - Linear Style
 * WHITE background with focus states
 */

import React from 'react';
import { colors, borderRadius, shadows, animations, spacing } from '../../lib/design-system';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helpText?: string;
  error?: string;
}

const inputStyles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing[2],
  },

  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.text.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },

  input: {
    background: colors.bg.primary,  // WHITE
    border: `1px solid ${colors.border.base}`,
    borderRadius: borderRadius.base,
    padding: '8px 12px',
    fontSize: '14px',
    color: colors.text.primary,
    transition: animations.base,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',

    '&:focus': {
      borderColor: colors.border.focus,
      boxShadow: shadows.focus,
    },
  },

  helpText: {
    fontSize: '12px',
    color: colors.text.tertiary,
    lineHeight: 1.4,
  },

  error: {
    fontSize: '12px',
    color: colors.accent.red,
    lineHeight: 1.4,
  },
};

export const Input: React.FC<InputProps> = ({
  label,
  helpText,
  error,
  style,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const inputStyleCombined = {
    ...inputStyles.input,
    ...(error && {
      borderColor: colors.accent.red,
    }),
    ...(isFocused && {
      borderColor: error ? colors.accent.red : colors.border.focus,
      boxShadow: error
        ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
        : shadows.focus,
    }),
    ...style,
  };

  return (
    <div style={inputStyles.wrapper}>
      {label && <label style={inputStyles.label}>{label}</label>}
      <input
        style={inputStyleCombined}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <div style={inputStyles.error}>{error}</div>}
      {!error && helpText && <div style={inputStyles.helpText}>{helpText}</div>}
    </div>
  );
};

export default Input;
