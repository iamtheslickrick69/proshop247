/**
 * Demo Page - White Theme
 * Shows custom golf course demo with chat interface
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { demoAPI, type DemoInfo } from '../lib/api';
import ChatWidget from '../components/ChatWidget';
import { whiteTheme, whiteTypography } from '../lib/white-theme';

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
      background: whiteTheme.bg.primary,
      minHeight: '100vh',
      fontFamily: whiteTypography.fontFamily,
    },

    nav: {
      position: 'sticky' as const,
      top: 0,
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${whiteTheme.border.light}`,
      zIndex: 100,
    },

    navContent: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    logo: {
      fontSize: '20px',
      fontWeight: 600,
      color: whiteTheme.text.primary,
      letterSpacing: '-0.01em',
    },

    navButton: {
      padding: '8px 16px',
      background: whiteTheme.bg.secondary,
      color: whiteTheme.text.primary,
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    container: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '48px 32px',
    },

    header: {
      marginBottom: '48px',
    },

    title: {
      ...whiteTypography.heading.h1,
      fontSize: '36px',
      color: whiteTheme.text.primary,
      marginBottom: '12px',
    },

    subtitle: {
      fontSize: '16px',
      color: whiteTheme.text.secondary,
      marginBottom: '16px',
    },

    statusBadge: {
      display: 'inline-block',
      padding: '6px 12px',
      background: whiteTheme.accent.greenLight,
      color: whiteTheme.accent.green,
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
    },

    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 350px',
      gap: '32px',
    },

    chatSection: {
      background: whiteTheme.bg.primary,
    },

    infoCard: {
      background: whiteTheme.bg.secondary,
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '12px',
      padding: '24px',
      height: 'fit-content',
    },

    infoSection: {
      marginBottom: '24px',
      paddingBottom: '24px',
      borderBottom: `1px solid ${whiteTheme.border.light}`,
    },

    infoSectionLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottom: 'none',
    },

    infoLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: whiteTheme.text.tertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      marginBottom: '8px',
    },

    infoValue: {
      fontSize: '14px',
      color: whiteTheme.text.primary,
      lineHeight: 1.6,
    },

    usageBar: {
      width: '100%',
      height: '8px',
      background: whiteTheme.bg.primary,
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '12px',
      border: `1px solid ${whiteTheme.border.light}`,
    },

    usageProgress: (percentage: number) => ({
      height: '100%',
      background: percentage > 80 ? whiteTheme.accent.red : whiteTheme.accent.green,
      width: `${percentage}%`,
      transition: 'width 0.3s ease',
    }),

    usageText: {
      fontSize: '14px',
      fontWeight: 600,
      color: whiteTheme.text.primary,
      marginBottom: '4px',
    },

    usageWarning: {
      fontSize: '12px',
      color: whiteTheme.accent.amber,
      marginTop: '8px',
    },

    amenitiesGrid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '8px',
    },

    amenityTag: {
      background: whiteTheme.bg.primary,
      border: `1px solid ${whiteTheme.border.light}`,
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      color: whiteTheme.text.secondary,
    },

    ctaButton: {
      width: '100%',
      padding: '12px 20px',
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: '24px',
    },

    limitCard: {
      background: '#FEE2E2',
      border: `1px solid ${whiteTheme.accent.red}`,
      borderRadius: '12px',
      padding: '32px',
      textAlign: 'center' as const,
    },

    limitTitle: {
      fontSize: '24px',
      fontWeight: 600,
      color: whiteTheme.accent.red,
      marginBottom: '12px',
    },

    limitMessage: {
      fontSize: '14px',
      color: whiteTheme.text.secondary,
      marginBottom: '24px',
      lineHeight: 1.6,
    },

    limitButton: {
      padding: '12px 24px',
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
    },

    loadingContainer: {
      textAlign: 'center' as const,
      padding: '80px 20px',
    },

    loadingText: {
      fontSize: '16px',
      color: whiteTheme.text.secondary,
    },
  };

  if (isLoading) {
    return (
      <div style={styles.page}>
        <nav style={styles.nav}>
          <div style={styles.navContent}>
            <div style={styles.logo}>ProShop 24/7</div>
          </div>
        </nav>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>Loading demo...</div>
        </div>
      </div>
    );
  }

  if (error || !demoInfo) {
    return (
      <div style={styles.page}>
        <nav style={styles.nav}>
          <div style={styles.navContent}>
            <div style={styles.logo}>ProShop 24/7</div>
          </div>
        </nav>
        <div style={styles.container}>
          <div style={styles.limitCard}>
            <h2 style={styles.limitTitle}>Demo Not Found</h2>
            <p style={styles.limitMessage}>
              {error || 'This demo does not exist or has been removed.'}
            </p>
            <button style={styles.limitButton} onClick={() => window.location.href = '/'}>
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = (interactionCount / interactionLimit) * 100;
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = interactionCount >= interactionLimit;

  return (
    <>
      <style>{`
        .nav-button:hover {
          background: ${whiteTheme.bg.hover};
          border-color: ${whiteTheme.border.medium};
        }

        .cta-button:hover {
          background: ${whiteTheme.accent.blueHover};
        }

        @media (max-width: 1024px) {
          .demo-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={styles.page}>
        <nav style={styles.nav}>
          <div style={styles.navContent}>
            <div style={styles.logo}>ProShop 24/7</div>
            <button
              className="nav-button"
              style={styles.navButton}
              onClick={() => window.location.href = '/'}
            >
              Create Your Own Demo
            </button>
          </div>
        </nav>

        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>{demoInfo.name}</h1>
            {demoInfo.website_url && (
              <p style={styles.subtitle}>
                AI-powered demo • <a href={demoInfo.website_url} target="_blank" rel="noopener noreferrer" style={{ color: whiteTheme.accent.blue }}>
                  Visit Website
                </a>
              </p>
            )}
            <div style={styles.statusBadge}>
              {demoInfo.status === 'active' ? 'Active' : 'Processing'}
            </div>
          </div>

          <div className="demo-grid" style={styles.grid}>
            {/* Chat Widget */}
            <div style={styles.chatSection}>
              {isAtLimit ? (
                <div style={styles.limitCard}>
                  <h3 style={styles.limitTitle}>Demo Limit Reached</h3>
                  <p style={styles.limitMessage}>
                    This demo has reached its interaction limit of {interactionLimit}.
                    Ready to unlock unlimited conversations for your golf course?
                  </p>
                  <button
                    style={styles.limitButton}
                    onClick={() => window.location.href = '/'}
                  >
                    Get ProShop 24/7 →
                  </button>
                </div>
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
              <div style={styles.infoCard}>
                {/* Usage */}
                <div style={styles.infoSection}>
                  <div style={styles.infoLabel}>Usage</div>
                  <div style={styles.usageText}>
                    {interactionCount} / {interactionLimit} interactions
                  </div>
                  <div style={styles.usageBar}>
                    <div style={styles.usageProgress(usagePercentage)} />
                  </div>
                  {isNearLimit && !isAtLimit && (
                    <div style={styles.usageWarning}>
                      ⚠️ Running low on interactions
                    </div>
                  )}
                </div>

                {/* Course Info */}
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
                        <div style={styles.amenitiesGrid}>
                          {demoInfo.ai_data.amenities.map((amenity: string, index: number) => (
                            <span key={index} style={styles.amenityTag}>
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoInfo.ai_data.special_features && (
                      <div style={{ ...styles.infoSection, ...styles.infoSectionLast }}>
                        <div style={styles.infoLabel}>Special Features</div>
                        <div style={styles.infoValue}>{demoInfo.ai_data.special_features}</div>
                      </div>
                    )}
                  </>
                )}

                {/* CTA */}
                <button
                  className="cta-button"
                  style={styles.ctaButton}
                  onClick={() => window.location.href = '/'}
                >
                  Get ProShop 24/7 for Your Course →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoPage;
