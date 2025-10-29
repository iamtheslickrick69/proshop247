/**
 * Card Component - Linear Style
 * WHITE background with subtle gray border
 */

import React from 'react';
import { colors, borderRadius, shadows, animations, spacing } from '../../lib/design-system';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const cardStyles = {
  base: {
    background: colors.bg.primary,  // PURE WHITE
    border: `1px solid ${colors.border.base}`,  // Subtle gray border
    borderRadius: borderRadius.large,
    boxShadow: shadows.small,
    transition: animations.base,
    padding: spacing[4],
  },

  hover: {
    '&:hover': {
      borderColor: colors.border.hover,
      boxShadow: shadows.medium,
      transform: 'translateY(-2px)',
      cursor: 'pointer',
    },
  },
};

export const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  className = '',
  style,
  onClick,
}) => {
  const combinedStyle = {
    ...cardStyles.base,
    ...(onClick && { cursor: 'pointer' }),
    ...style,
  };

  return (
    <div
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      style={combinedStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover || onClick) {
          e.currentTarget.style.borderColor = colors.border.hover;
          e.currentTarget.style.boxShadow = shadows.medium;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover || onClick) {
          e.currentTarget.style.borderColor = colors.border.base;
          e.currentTarget.style.boxShadow = shadows.small;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </div>
  );
};

// Card sub-components for structured content
export const CardHeader: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing[3],
      ...style,
    }}
  >
    {children}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      color: colors.text.primary,
      fontSize: '14px',
      lineHeight: 1.5,
      ...style,
    }}
  >
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing[3],
      paddingTop: spacing[3],
      borderTop: `1px solid ${colors.border.base}`,
      ...style,
    }}
  >
    {children}
  </div>
);

export default Card;
