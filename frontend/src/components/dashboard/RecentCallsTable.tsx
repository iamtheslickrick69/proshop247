/**
 * Recent Calls Table - Call History Display
 * Modern animated table with glassmorphism effects
 */

import React, { useState } from 'react';
import { colors, spacing, typography } from '../../lib/design-system';

export interface Call {
  id: string;
  caller: string;
  phone: string;
  time: string;
  duration: string;
  status: 'completed' | 'missed' | 'voicemail';
  outcome: string;
}

interface RecentCallsTableProps {
  calls: Call[];
  onCallClick?: (call: Call) => void;
}

export const RecentCallsTable: React.FC<RecentCallsTableProps> = ({ calls, onCallClick }) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const styles = {
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },

    tableHeader: {
      borderBottom: `1px solid ${colors.border.base}`,
    },

    tableHeaderCell: {
      ...typography.micro,
      color: colors.text.tertiary,
      padding: `${spacing[3]} ${spacing[4]}`,
      textAlign: 'left' as const,
      fontWeight: 600,
    },

    tableRow: (isHovered: boolean) => ({
      borderBottom: `1px solid ${colors.border.base}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      background: isHovered
        ? `linear-gradient(90deg, ${colors.accent.blue}05 0%, transparent 100%)`
        : 'transparent',
      transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
      boxShadow: isHovered ? `inset 3px 0 0 ${colors.accent.blue}` : 'none',
    }),

    tableCell: {
      padding: `${spacing[4]} ${spacing[4]}`,
      fontSize: '14px',
      color: colors.text.secondary,
    },

    callerName: {
      color: colors.text.primary,
      fontWeight: 500,
    },

    phone: {
      fontSize: '12px',
      color: colors.text.tertiary,
    },

    statusPill: (status: 'completed' | 'missed' | 'voicemail') => {
      const statusColors = {
        completed: {
          bg: colors.bg.tertiary,
          color: colors.accent.green,
        },
        missed: {
          bg: colors.accent.red + '10',
          color: colors.accent.red,
        },
        voicemail: {
          bg: colors.accent.amber + '10',
          color: colors.accent.amber,
        },
      };

      return {
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        background: statusColors[status].bg,
        color: statusColors[status].color,
      };
    },
  };

  return (
    <table style={styles.table}>
      <thead style={styles.tableHeader}>
        <tr>
          <th style={styles.tableHeaderCell}>CALLER</th>
          <th style={styles.tableHeaderCell}>TIME</th>
          <th style={styles.tableHeaderCell}>DURATION</th>
          <th style={styles.tableHeaderCell}>STATUS</th>
          <th style={styles.tableHeaderCell}>OUTCOME</th>
        </tr>
      </thead>
      <tbody>
        {calls.map((call) => {
          const isHovered = hoveredRow === call.id;

          return (
            <tr
              key={call.id}
              style={styles.tableRow(isHovered)}
              onClick={() => onCallClick?.(call)}
              onMouseEnter={() => setHoveredRow(call.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
            <td style={styles.tableCell}>
              <div style={styles.callerName}>{call.caller}</div>
              <div style={styles.phone}>{call.phone}</div>
            </td>
            <td style={styles.tableCell}>{call.time}</td>
            <td style={styles.tableCell}>{call.duration}</td>
            <td style={styles.tableCell}>
              <span style={styles.statusPill(call.status)}>{call.status}</span>
            </td>
            <td style={styles.tableCell}>{call.outcome}</td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default RecentCallsTable;
