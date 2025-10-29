/**
 * StatusPill Component - Linear Style
 * Tiny colored pills for status (ONE OF THE FEW PLACES WITH COLOR)
 */

import React from 'react';
import { colors, borderRadius } from '../../lib/design-system';

export type StatusType = 'active' | 'booking' | 'answered' | 'missed' | 'pending';

interface StatusPillProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
}

const statusPillStyles = {
  base: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: borderRadius.small,
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em',
  },

  variants: {
    active: {
      background: colors.status.active.bg,
      color: colors.status.active.text,
    },
    booking: {
      background: colors.status.booking.bg,
      color: colors.status.booking.text,
    },
    answered: {
      background: colors.status.answered.bg,
      color: colors.status.answered.text,
    },
    missed: {
      background: colors.status.missed.bg,
      color: colors.status.missed.text,
    },
    pending: {
      background: colors.status.pending.bg,
      color: colors.status.pending.text,
    },
  },
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  children,
  className = '',
}) => {
  const combinedStyle = {
    ...statusPillStyles.base,
    ...statusPillStyles.variants[status],
  };

  return (
    <span className={`status-pill status-${status} ${className}`} style={combinedStyle}>
      {children}
    </span>
  );
};

export default StatusPill;
