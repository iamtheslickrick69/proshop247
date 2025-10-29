/**
 * Dashboard Sidebar - Modern Animated
 * Navigation for operator dashboard with smooth animations
 */

import React, { useState } from 'react';
import { colors, spacing, typography } from '../../lib/design-system';

interface NavItem {
  icon: string;
  label: string;
  path: string;
  active?: boolean;
}

interface SidebarProps {
  activeRoute?: string;
  onNavigate?: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeRoute = '/dashboard', onNavigate }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '📞', label: 'Recent Calls', path: '/calls' },
    { icon: '📅', label: 'Bookings', path: '/bookings' },
    { icon: '👥', label: 'Callers', path: '/callers' },
    { icon: '⚙️', label: 'Settings', path: '/settings' },
    { icon: '📚', label: 'Knowledge Base', path: '/knowledge' },
  ];

  const styles = {
    sidebar: {
      width: '240px',
      height: '100vh',
      background: colors.bg.secondary,
      borderRight: `1px solid ${colors.border.base}`,
      display: 'flex',
      flexDirection: 'column' as const,
      padding: spacing[4],
      position: 'fixed' as const,
      left: 0,
      top: 0,
    },

    logo: {
      fontSize: '20px',
      fontWeight: 600,
      color: colors.text.primary,
      marginBottom: spacing[8],
      padding: spacing[2],
    },

    navSection: {
      marginBottom: spacing[6],
    },

    navSectionTitle: {
      ...typography.micro,
      color: colors.text.tertiary,
      marginBottom: spacing[2],
      paddingLeft: spacing[3],
    },

    navItem: (isActive: boolean, isHovered: boolean) => ({
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      padding: `${spacing[3]} ${spacing[3]}`,
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 500,
      color: isActive ? colors.accent.blue : isHovered ? colors.text.primary : colors.text.secondary,
      background: isActive
        ? `linear-gradient(135deg, ${colors.accent.blue}15 0%, ${colors.accent.blue}08 100%)`
        : isHovered
        ? colors.bg.tertiary
        : 'transparent',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      marginBottom: spacing[2],
      boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
      transform: isHovered && !isActive ? 'translateX(4px)' : 'translateX(0)',
      border: `1px solid ${isActive ? colors.accent.blue + '30' : 'transparent'}`,
    }),

    navItemIcon: (isActive: boolean, isHovered: boolean) => ({
      fontSize: '18px',
      transition: 'transform 0.3s ease',
      transform: isHovered ? 'scale(1.2) rotate(5deg)' : 'scale(1) rotate(0deg)',
      filter: isActive ? 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))' : 'none',
    }),

    activeIndicator: {
      position: 'absolute' as const,
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: '3px',
      height: '20px',
      background: colors.accent.blue,
      borderRadius: '0 2px 2px 0',
    },

    footer: {
      marginTop: 'auto',
      padding: spacing[3],
      borderTop: `1px solid ${colors.border.base}`,
      display: 'flex',
      alignItems: 'center',
      gap: spacing[2],
    },

    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: colors.accent.blue,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 600,
    },

    userName: {
      fontSize: '14px',
      fontWeight: 500,
      color: colors.text.primary,
    },

    userEmail: {
      fontSize: '12px',
      color: colors.text.tertiary,
    },
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>ProShop 24/7</div>

      <div style={styles.navSection}>
        <div style={styles.navSectionTitle}>OVERVIEW</div>
        {navItems.slice(0, 4).map((item) => {
          const isActive = activeRoute === item.path;
          const isHovered = hoveredItem === item.path;

          return (
            <div
              key={item.path}
              style={styles.navItem(isActive, isHovered)}
              onClick={() => onNavigate?.(item.path)}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {isActive && <div style={styles.activeIndicator} />}
              <span style={styles.navItemIcon(isActive, isHovered)}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      <div style={styles.navSection}>
        <div style={styles.navSectionTitle}>MANAGE</div>
        {navItems.slice(4).map((item) => {
          const isActive = activeRoute === item.path;
          const isHovered = hoveredItem === item.path;

          return (
            <div
              key={item.path}
              style={styles.navItem(isActive, isHovered)}
              onClick={() => onNavigate?.(item.path)}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {isActive && <div style={styles.activeIndicator} />}
              <span style={styles.navItemIcon(isActive, isHovered)}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      <div style={styles.footer}>
        <div style={styles.avatar}>FH</div>
        <div>
          <div style={styles.userName}>Fox Hollow</div>
          <div style={styles.userEmail}>owner@foxhollow.com</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
