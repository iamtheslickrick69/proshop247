/**
 * Demo Page - Custom Golf Course Demo
 * Shows chat interface with course-specific data
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { demoAPI, type DemoInfo } from '../lib/api';
import ChatWidget from '../components/ChatWidget';
import { Button, Card, StatusPill } from '../components/ui';
import { colors, spacing, typography } from '../lib/design-system';

export const DemoPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [demoInfo, setDemoInfo] = useState<DemoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [interactionLimit, setInteractionLimit] = useState(25);

  useEffect(() => {
    const loadDemoInfo = async () => {
      if (!slug) return;

      try {
        const info = await demoAPI.getDemoInfo(slug);
        setDemoInfo(info);
        setInteractionCount(info.interaction_count);
        setInteractionLimit(info.interaction_limit);
      } catch (err) {
        setError('Demo not found. Please check the URL or create a new demo.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDemoInfo();
  }, [slug]);

  const styles = {
    page: {
      background: colors.bg.primary,
      minHeight: '100vh',
      fontFamily: typography.fontFamily,
    },

    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${spacing[4]} ${spacing[6]}`,
      borderBottom: `1px solid ${colors.border.base}`,
      background: colors.bg.primary,
    },

    logo: {
      fontSize: '20px',
      fontWeight: 600,
      color: colors.text.primary,
      letterSpacing: '-0.02em',
    },

    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `${spacing[8]} ${spacing[6]}`,
    },

    header: {
      marginBottom: spacing[8],
    },

    title: {
      fontSize: '32px',
      fontWeight: 600,
      color: colors.text.primary,
      marginBottom: spacing[2],
    },

    subtitle: {
      fontSize: '16px',
      color: colors.text.secondary,
      marginBottom: spacing[4],
    },

    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: spacing[6],
    },

    infoCard: {
      height: 'fit-content',
    },

    infoSection: {
      marginBottom: spacing[4],
    },

    infoLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: colors.text.tertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: spacing[1],
    },

    infoValue: {
      fontSize: '14px',
      color: colors.text.primary,
    },

    usageBar: {
      width: '100%',
      height: '8px',
      background: colors.bg.tertiary,
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: spacing[2],
    },

    usageProgress: (percentage: number) => ({
      height: '100%',
      background: percentage > 80 ? colors.accent.red : colors.accent.green,
      width: `${percentage}%`,
      transition: 'width 0.3s ease',
    }),
  };

  if (isLoading) {
    return (
      <div style={styles.page}>
        <nav style={styles.nav}>
          <div style={styles.logo}>ProShop 24/7</div>
        </nav>
        <div style={styles.container}>
          <div style={{ textAlign: 'center', padding: spacing[16] }}>
            <p style={{ color: colors.text.secondary }}>Loading demo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !demoInfo) {
    return (
      <div style={styles.page}>
        <nav style={styles.nav}>
          <div style={styles.logo}>ProShop 24/7</div>
        </nav>
        <div style={styles.container}>
          <Card>
            <h2 style={{ fontSize: '24px', marginBottom: spacing[3], color: colors.accent.red }}>
              Demo Not Found
            </h2>
            <p style={{ color: colors.text.secondary, marginBottom: spacing[4] }}>
              {error || 'This demo does not exist or has been removed.'}
            </p>
            <Button variant="primary" onClick={() => window.location.href = '/'}>
              Go Back Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const usagePercentage = (interactionCount / interactionLimit) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = interactionCount >= interactionLimit;

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}>ProShop 24/7</div>
        <Button variant="secondary" onClick={() => window.location.href = '/'}>
          Create Your Own Demo
        </Button>
      </nav>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{demoInfo.name}</h1>
          <p style={styles.subtitle}>
            AI-powered demo created from {demoInfo.website_url}
          </p>
          <StatusPill status={demoInfo.status === 'active' ? 'active' : 'pending'}>
            {demoInfo.status}
          </StatusPill>
        </div>

        <div style={styles.grid}>
          {/* Chat Widget */}
          <div>
            {isAtLimit ? (
              <Card>
                <h3 style={{ fontSize: '20px', marginBottom: spacing[3], color: colors.accent.red }}>
                  Demo Limit Reached
                </h3>
                <p style={{ color: colors.text.secondary, marginBottom: spacing[4] }}>
                  This demo has reached its interaction limit of {interactionLimit}. Ready to go live?
                </p>
                <Button variant="primary">Get Started with ProShop 24/7 →</Button>
              </Card>
            ) : (
              <ChatWidget
                demoSlug={slug}
                initialMessage={`Hi! Welcome to ${demoInfo.name}. How can I help you today?`}
                onInteractionCountChange={(count, limit) => {
                  setInteractionCount(count);
                  setInteractionLimit(limit);
                }}
              />
            )}
          </div>

          {/* Demo Info Sidebar */}
          <div>
            <Card style={styles.infoCard}>
              <div style={styles.infoSection}>
                <div style={styles.infoLabel}>Usage</div>
                <div style={styles.infoValue}>
                  {interactionCount} / {interactionLimit} interactions
                  {isNearLimit && !isAtLimit && (
                    <span style={{ color: colors.accent.amber, marginLeft: spacing[2] }}>
                      (Running low)
                    </span>
                  )}
                </div>
                <div style={styles.usageBar}>
                  <div style={styles.usageProgress(usagePercentage)} />
                </div>
              </div>

              {demoInfo.ai_data && (
                <>
                  {demoInfo.ai_data.location && (
                    <div style={styles.infoSection}>
                      <div style={styles.infoLabel}>Location</div>
                      <div style={styles.infoValue}>{demoInfo.ai_data.location}</div>
                    </div>
                  )}

                  {demoInfo.ai_data.hours && (
                    <div style={styles.infoSection}>
                      <div style={styles.infoLabel}>Hours</div>
                      <div style={styles.infoValue}>{demoInfo.ai_data.hours}</div>
                    </div>
                  )}

                  {demoInfo.ai_data.pricing_summary && (
                    <div style={styles.infoSection}>
                      <div style={styles.infoLabel}>Pricing</div>
                      <div style={styles.infoValue}>{demoInfo.ai_data.pricing_summary}</div>
                    </div>
                  )}

                  {demoInfo.ai_data.amenities && demoInfo.ai_data.amenities.length > 0 && (
                    <div style={styles.infoSection}>
                      <div style={styles.infoLabel}>Amenities</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[2] }}>
                        {demoInfo.ai_data.amenities.map((amenity: string, index: number) => (
                          <span
                            key={index}
                            style={{
                              background: colors.bg.tertiary,
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: colors.text.secondary,
                            }}
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {demoInfo.ai_data.special_features && (
                    <div style={styles.infoSection}>
                      <div style={styles.infoLabel}>Special Features</div>
                      <div style={styles.infoValue}>{demoInfo.ai_data.special_features}</div>
                    </div>
                  )}
                </>
              )}

              <div style={{
                marginTop: spacing[6],
                paddingTop: spacing[4],
                borderTop: `1px solid ${colors.border.base}`,
              }}>
                <Button
                  variant="primary"
                  onClick={() => window.location.href = '/'}
                  style={{ width: '100%' }}
                >
                  Get ProShop 24/7 for Your Course →
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
