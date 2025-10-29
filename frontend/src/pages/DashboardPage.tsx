/**
 * Dashboard Page - Operator Overview
 * Linear-style dashboard for golf course operators
 */

import React, { useState } from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { MetricCard } from '../components/dashboard/MetricCard';
import { MiniChart } from '../components/dashboard/MiniChart';
import { RecentCallsTable, type Call } from '../components/dashboard/RecentCallsTable';
import { Button, Card } from '../components/ui';
import { colors, spacing, typography } from '../lib/design-system';

export const DashboardPage: React.FC = () => {
  const [activeRoute] = useState('/dashboard');

  // Mock data - will be replaced with real API calls
  const metrics = [
    {
      label: 'CALLS TODAY',
      value: 47,
      trend: { value: 12, direction: 'up' as const },
      icon: '📞',
      status: 'success' as const,
    },
    {
      label: 'ANSWER RATE',
      value: '89%',
      trend: { value: 5, direction: 'up' as const },
      icon: '✅',
      status: 'success' as const,
    },
    {
      label: 'REVENUE TODAY',
      value: '$2,340',
      trend: { value: 18, direction: 'up' as const },
      icon: '💰',
      status: 'success' as const,
    },
    {
      label: 'BOOKINGS CREATED',
      value: 12,
      trend: { value: 3, direction: 'down' as const },
      icon: '📅',
      status: 'warning' as const,
    },
  ];

  // Mock call trends data (last 7 days)
  const callTrendsData = [42, 38, 51, 45, 47, 43, 47];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const recentCalls: Call[] = [
    {
      id: '1',
      caller: 'John Smith',
      phone: '+1 (555) 123-4567',
      time: '2 minutes ago',
      duration: '3:24',
      status: 'completed',
      outcome: 'Booked tee time for Saturday 9am',
    },
    {
      id: '2',
      caller: 'Sarah Johnson',
      phone: '+1 (555) 234-5678',
      time: '15 minutes ago',
      duration: '1:45',
      status: 'completed',
      outcome: 'Asked about membership pricing',
    },
    {
      id: '3',
      caller: 'Mike Wilson',
      phone: '+1 (555) 345-6789',
      time: '32 minutes ago',
      duration: '4:12',
      status: 'completed',
      outcome: 'Booked league play for Sunday',
    },
    {
      id: '4',
      caller: 'Unknown',
      phone: '+1 (555) 456-7890',
      time: '1 hour ago',
      duration: '0:45',
      status: 'missed',
      outcome: 'Caller hung up',
    },
  ];

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      background: colors.bg.secondary,
      fontFamily: typography.fontFamily,
    },

    main: {
      marginLeft: '240px',
      flex: 1,
      padding: spacing[8],
    },

    header: {
      marginBottom: spacing[8],
      position: 'relative' as const,
      padding: spacing[6],
      background: `linear-gradient(135deg, ${colors.bg.primary} 0%, ${colors.bg.secondary} 100%)`,
      borderRadius: '20px',
      border: `1px solid ${colors.border.base}`,
      overflow: 'hidden',
    },

    headerGlow: {
      position: 'absolute' as const,
      top: '-50%',
      right: '-20%',
      width: '400px',
      height: '400px',
      background: `radial-gradient(circle, ${colors.accent.blue}20 0%, transparent 70%)`,
      borderRadius: '50%',
      animation: 'float 6s ease-in-out infinite',
    },

    headerContent: {
      position: 'relative' as const,
      zIndex: 1,
    },

    title: {
      fontSize: '42px',
      fontWeight: 700,
      background: `linear-gradient(135deg, ${colors.text.primary} 0%, ${colors.accent.blue} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.03em',
      marginBottom: spacing[2],
    },

    subtitle: {
      fontSize: '16px',
      color: colors.text.secondary,
      display: 'flex',
      alignItems: 'center',
      gap: spacing[2],
    },

    liveIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[1],
      padding: `${spacing[1]} ${spacing[2]}`,
      background: `${colors.accent.green}15`,
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600,
      color: colors.accent.green,
    },

    pulsingDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: colors.accent.green,
      animation: 'pulse 2s ease-in-out infinite',
    },

    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: spacing[4],
      marginBottom: spacing[8],
    },

    section: {
      marginBottom: spacing[8],
    },

    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[4],
    },

    sectionTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: colors.text.primary,
    },
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>

      <div style={styles.container}>
        <Sidebar activeRoute={activeRoute} />

        <main style={styles.main}>
          <div style={styles.header}>
            <div style={styles.headerGlow} />
            <div style={styles.headerContent}>
              <h1 style={styles.title}>Dashboard</h1>
              <div style={styles.subtitle}>
                <span>Fox Hollow Golf Course · Today, {new Date().toLocaleDateString()}</span>
                <div style={styles.liveIndicator}>
                  <div style={styles.pulsingDot} />
                  <span>LIVE</span>
                </div>
              </div>
            </div>
          </div>

        {/* Metrics Grid */}
        <div style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              label={metric.label}
              value={metric.value}
              trend={metric.trend}
              icon={metric.icon}
              status={metric.status}
            />
          ))}
        </div>

        {/* Call Trends Chart */}
        <div style={styles.section}>
          <Card>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Call Volume Trends</h2>
              <Button variant="ghost">Last 7 Days</Button>
            </div>

            <div style={{ padding: spacing[4] }}>
              <MiniChart data={callTrendsData} color={colors.accent.blue} height={120} />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: spacing[3],
                paddingTop: spacing[3],
                borderTop: `1px solid ${colors.border.base}`,
              }}>
                {days.map((day, index) => (
                  <div
                    key={day}
                    style={{
                      fontSize: '12px',
                      color: colors.text.tertiary,
                      fontWeight: 500,
                      textAlign: 'center' as const,
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Calls Section */}
        <div style={styles.section}>
          <Card>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Recent Calls</h2>
              <Button variant="ghost">View All →</Button>
            </div>

            <RecentCallsTable calls={recentCalls} />
          </Card>
        </div>

        {/* Agent Status Section */}
        <div style={styles.section}>
          <Card>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>AI Agent Status</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: colors.accent.green,
                boxShadow: `0 0 0 4px ${colors.accent.green}20`,
              }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: colors.text.primary }}>
                  Active
                </div>
                <div style={{ fontSize: '14px', color: colors.text.secondary }}>
                  Ready to answer calls · Last call 2 minutes ago
                </div>
              </div>
              <Button variant="secondary" style={{ marginLeft: 'auto' }}>
                Configure Agent
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
    </>
  );
};

export default DashboardPage;
