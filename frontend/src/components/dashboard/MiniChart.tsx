/**
 * Mini Chart - Animated Bar Chart
 * Lightweight data visualization for dashboard metrics
 */

import React, { useState, useEffect } from 'react';
import { colors } from '../../lib/design-system';

interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  color = colors.accent.blue,
  height = 60,
}) => {
  const [animatedData, setAnimatedData] = useState<number[]>(data.map(() => 0));

  useEffect(() => {
    // Animate bars on mount
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  const maxValue = Math.max(...data, 1);
  const barWidth = 100 / data.length - 2;

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '4px',
      height: `${height}px`,
      padding: '8px 0',
    },

    bar: (value: number, index: number) => ({
      flex: 1,
      height: `${(value / maxValue) * 100}%`,
      background: `linear-gradient(180deg, ${color} 0%, ${color}80 100%)`,
      borderRadius: '4px 4px 0 0',
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDelay: `${index * 0.05}s`,
      minHeight: '2px',
      position: 'relative' as const,
      cursor: 'pointer',
      boxShadow: `0 -2px 8px ${color}30`,
    }),

    barHover: {
      filter: 'brightness(1.2)',
      transform: 'scaleY(1.05)',
    },

    tooltip: {
      position: 'absolute' as const,
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-8px)',
      background: colors.text.primary,
      color: colors.bg.primary,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      whiteSpace: 'nowrap' as const,
      opacity: 0,
      transition: 'opacity 0.2s ease',
      pointerEvents: 'none' as const,
    },
  };

  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div style={styles.container}>
      {animatedData.map((value, index) => (
        <div
          key={index}
          style={{
            ...styles.bar(value, index),
            ...(hoveredBar === index ? styles.barHover : {}),
          }}
          onMouseEnter={() => setHoveredBar(index)}
          onMouseLeave={() => setHoveredBar(null)}
        >
          <div
            style={{
              ...styles.tooltip,
              opacity: hoveredBar === index ? 1 : 0,
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MiniChart;
