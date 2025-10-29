/**
 * Metric Card - Dashboard Statistics
 * Modern animated metric display with glassmorphism and gradients
 */

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography } from '../../lib/design-system';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  icon,
  status = 'neutral',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animated counter for numeric values
  useEffect(() => {
    const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/[^0-9]/g, ''));
    if (!isNaN(numericValue)) {
      let startValue = 0;
      const duration = 1500;
      const increment = numericValue / (duration / 16);

      const timer = setInterval(() => {
        startValue += increment;
        if (startValue >= numericValue) {
          setAnimatedValue(numericValue);
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(startValue));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [value]);

  const getStatusGradient = () => {
    switch (status) {
      case 'success':
        return 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)';
      case 'warning':
        return 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)';
      case 'danger':
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return colors.accent.green;
      case 'warning':
        return colors.accent.amber;
      case 'danger':
        return colors.accent.red;
      default:
        return colors.accent.blue;
    }
  };

  const styles = {
    card: {
      position: 'relative' as const,
      background: colors.bg.primary,
      border: `1px solid ${colors.border.base}`,
      borderRadius: '16px',
      padding: spacing[6],
      display: 'flex',
      flexDirection: 'column' as const,
      gap: spacing[3],
      cursor: 'pointer',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
      boxShadow: isHovered
        ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        : '0 1px 3px rgba(0, 0, 0, 0.04)',
    },

    gradientOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: getStatusGradient(),
      opacity: isHovered ? 1 : 0.6,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none' as const,
    },

    floatingOrb: {
      position: 'absolute' as const,
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${getStatusColor()}30 0%, transparent 70%)`,
      top: '-40px',
      right: '-40px',
      transition: 'all 0.5s ease',
      transform: isHovered ? 'scale(1.5)' : 'scale(1)',
      opacity: 0.5,
      pointerEvents: 'none' as const,
    },

    content: {
      position: 'relative' as const,
      zIndex: 1,
    },

    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing[2],
    },

    label: {
      ...typography.micro,
      color: colors.text.tertiary,
      fontWeight: 600,
      letterSpacing: '0.05em',
    },

    iconWrapper: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      background: `${getStatusColor()}15`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      transition: 'transform 0.3s ease',
      transform: isHovered ? 'rotate(12deg) scale(1.1)' : 'rotate(0deg) scale(1)',
    },

    valueContainer: {
      marginBottom: spacing[2],
    },

    value: {
      fontSize: '48px',
      fontWeight: 700,
      color: colors.text.primary,
      letterSpacing: '-0.03em',
      lineHeight: 1,
      background: `linear-gradient(135deg, ${colors.text.primary} 0%, ${getStatusColor()} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: isHovered ? 'transparent' : colors.text.primary,
      transition: 'all 0.3s ease',
    },

    trend: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[2],
      fontSize: '13px',
      fontWeight: 600,
      color: getStatusColor(),
      padding: `${spacing[1]} ${spacing[2]}`,
      background: `${getStatusColor()}10`,
      borderRadius: '6px',
      width: 'fit-content',
    },

    trendIcon: (direction: 'up' | 'down') => ({
      fontSize: '14px',
      fontWeight: 'bold',
      animation: 'bounce 1s ease-in-out infinite',
      display: 'inline-block',
    }),

    sparkline: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: `linear-gradient(90deg, transparent 0%, ${getStatusColor()} 50%, transparent 100%)`,
      animation: isHovered ? 'shimmer 1.5s ease-in-out infinite' : 'none',
    },
  };

  const displayValue = typeof value === 'number' || !isNaN(parseInt(value.toString().replace(/[^0-9]/g, '')))
    ? (typeof value === 'string' && value.includes('$')
        ? `$${animatedValue.toLocaleString()}`
        : typeof value === 'string' && value.includes('%')
        ? `${animatedValue}%`
        : animatedValue.toLocaleString())
    : value;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      <div
        style={styles.card}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={styles.gradientOverlay} />
        <div style={styles.floatingOrb} />

        <div style={styles.content}>
          <div style={styles.header}>
            <div style={styles.label}>{label}</div>
            {icon && (
              <div style={styles.iconWrapper}>
                <span>{icon}</span>
              </div>
            )}
          </div>

          <div style={styles.valueContainer}>
            <div style={styles.value}>{displayValue}</div>
          </div>

          {trend && (
            <div style={styles.trend}>
              <span style={styles.trendIcon(trend.direction)}>
                {trend.direction === 'up' ? '↗' : '↘'}
              </span>
              <span>
                {Math.abs(trend.value)}% vs yesterday
              </span>
            </div>
          )}
        </div>

        <div style={styles.sparkline} />
      </div>
    </>
  );
};

export default MetricCard;
