/**
 * Landing Page - Linear White Theme
 * ProShop 24/7 - Minimal white design
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { whiteTheme, whiteTypography } from '../lib/white-theme';
import ChatWidget from '../components/ChatWidget';
import DemoCreationModal from '../components/DemoCreationModal';

export const LandingPage: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [showFoxHollowChat, setShowFoxHollowChat] = useState(false);
  const [showCustomChat, setShowCustomChat] = useState(false);

  const styles = {
    page: {
      background: whiteTheme.bg.primary,
      minHeight: '100vh',
      color: whiteTheme.text.primary,
      fontFamily: whiteTypography.fontFamily,
    },

    // Navigation
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

    navLinks: {
      display: 'flex',
      gap: '32px',
      alignItems: 'center',
    },

    navLink: {
      fontSize: '14px',
      color: whiteTheme.text.secondary,
      cursor: 'pointer',
      transition: 'color 0.2s ease',
    },

    navButton: {
      padding: '8px 16px',
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    // Hero Section
    hero: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '120px 32px 80px',
      textAlign: 'center' as const,
    },

    heroTitle: {
      ...whiteTypography.heading.h1,
      fontSize: '64px',
      color: whiteTheme.text.primary,
      marginBottom: '24px',
      maxWidth: '900px',
      margin: '0 auto 24px',
    },

    heroSubtitle: {
      ...whiteTypography.body.large,
      color: whiteTheme.text.secondary,
      maxWidth: '700px',
      margin: '0 auto 48px',
    },

    heroCtaGroup: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      marginBottom: '80px',
    },

    primaryButton: {
      padding: '14px 28px',
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: whiteTheme.shadow.small,
    },

    secondaryButton: {
      padding: '14px 28px',
      background: whiteTheme.bg.primary,
      color: whiteTheme.text.primary,
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    // Dual Demo Section
    dualDemoSection: {
      maxWidth: '1280px',
      margin: '0 auto 120px',
      padding: '0 32px',
    },

    dualDemoGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '32px',
      marginTop: '48px',
    },

    demoCard: {
      background: whiteTheme.bg.secondary,
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '12px',
      padding: '32px',
      transition: 'all 0.2s ease',
    },

    demoCardTitle: {
      fontSize: '24px',
      fontWeight: 600,
      marginBottom: '12px',
      color: whiteTheme.text.primary,
    },

    demoCardDescription: {
      fontSize: '14px',
      color: whiteTheme.text.secondary,
      marginBottom: '24px',
      lineHeight: 1.6,
    },

    demoButton: {
      width: '100%',
      padding: '12px 24px',
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    demoPreview: {
      marginTop: '24px',
      padding: '16px',
      background: whiteTheme.bg.primary,
      border: `1px solid ${whiteTheme.border.light}`,
      borderRadius: '8px',
      fontSize: '13px',
      color: whiteTheme.text.tertiary,
      textAlign: 'center' as const,
    },

    // How It Works Section
    howItWorksSection: {
      background: whiteTheme.bg.tertiary,
      padding: '80px 32px',
      marginBottom: '120px',
    },

    howItWorksContent: {
      maxWidth: '1280px',
      margin: '0 auto',
    },

    sectionTitle: {
      ...whiteTypography.heading.h2,
      textAlign: 'center' as const,
      marginBottom: '64px',
      color: whiteTheme.text.primary,
    },

    stepsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '48px',
    },

    step: {
      textAlign: 'center' as const,
    },

    stepNumber: {
      width: '48px',
      height: '48px',
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 600,
      margin: '0 auto 24px',
    },

    stepTitle: {
      fontSize: '20px',
      fontWeight: 600,
      marginBottom: '12px',
      color: whiteTheme.text.primary,
    },

    stepDescription: {
      fontSize: '14px',
      color: whiteTheme.text.secondary,
      lineHeight: 1.6,
    },

    // Features Section
    featuresSection: {
      maxWidth: '1280px',
      margin: '0 auto 120px',
      padding: '0 32px',
    },

    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
      marginTop: '48px',
    },

    featureCard: {
      background: whiteTheme.bg.primary,
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '12px',
      padding: '32px',
      transition: 'all 0.2s ease',
    },

    featureIcon: {
      fontSize: '32px',
      marginBottom: '16px',
    },

    featureTitle: {
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: '8px',
      color: whiteTheme.text.primary,
    },

    featureDescription: {
      fontSize: '14px',
      color: whiteTheme.text.secondary,
      lineHeight: 1.6,
    },

    // Footer
    footer: {
      borderTop: `1px solid ${whiteTheme.border.base}`,
      padding: '48px 32px',
      textAlign: 'center' as const,
    },

    footerText: {
      fontSize: '14px',
      color: whiteTheme.text.tertiary,
    },

    // Chat Widget Overlay
    chatOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    },

    chatContainer: {
      width: '100%',
      maxWidth: '500px',
      maxHeight: '700px',
      position: 'relative' as const,
    },

    closeButton: {
      position: 'absolute' as const,
      top: '-40px',
      right: '0',
      background: '#FFFFFF',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      cursor: 'pointer',
      fontSize: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  const steps = [
    {
      number: '1',
      title: 'Upload Your Course Info',
      description: 'Share your website, menu, and scorecard. We extract everything we need automatically.',
    },
    {
      number: '2',
      title: 'AI Learns Your Course',
      description: 'Our AI analyzes your content and creates a custom knowledge base in minutes.',
    },
    {
      number: '3',
      title: 'Start Answering 24/7',
      description: 'Your demo is live. Test it out with 25 free interactions to see the magic.',
    },
  ];

  const features = [
    {
      icon: '⚡',
      title: 'Instant Setup',
      description: 'Get your demo live in under 5 minutes. No technical knowledge required.',
    },
    {
      icon: '🎯',
      title: 'Course-Specific Answers',
      description: 'AI trained on your exact course details, pricing, and policies.',
    },
    {
      icon: '💬',
      title: 'Natural Conversations',
      description: 'Answers questions like a real person, not a robotic chatbot.',
    },
    {
      icon: '📊',
      title: 'Track Every Interaction',
      description: 'See what questions golfers are asking and how your AI is performing.',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your course data is encrypted and never shared with anyone.',
    },
    {
      icon: '📱',
      title: 'Works Everywhere',
      description: 'Mobile-friendly chat widget that works on any device.',
    },
  ];

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .nav-link:hover {
          color: ${whiteTheme.text.primary};
        }

        .nav-button:hover {
          background: ${whiteTheme.accent.blueHover};
          transform: translateY(-1px);
          box-shadow: ${whiteTheme.shadow.medium};
        }

        .primary-btn:hover {
          background: ${whiteTheme.accent.blueHover};
          transform: translateY(-2px);
          box-shadow: ${whiteTheme.shadow.large};
        }

        .secondary-btn:hover {
          background: ${whiteTheme.bg.hover};
          border-color: ${whiteTheme.border.medium};
        }

        .demo-card:hover {
          box-shadow: ${whiteTheme.shadow.large};
          transform: translateY(-4px);
        }

        .feature-card:hover {
          box-shadow: ${whiteTheme.shadow.medium};
          border-color: ${whiteTheme.border.medium};
        }

        .demo-button:hover {
          background: ${whiteTheme.accent.blueHover};
        }

        @media (max-width: 768px) {
          .dual-demo-grid {
            grid-template-columns: 1fr !important;
          }
          .steps-grid {
            grid-template-columns: 1fr !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .hero-title {
            font-size: 40px !important;
          }
        }
      `}</style>

      <div style={styles.page}>
        {/* Navigation */}
        <nav style={styles.nav}>
          <div style={styles.navContent}>
            <div style={styles.logo}>ProShop 24/7</div>
            <div style={styles.navLinks}>
              <div className="nav-link" style={styles.navLink}>Features</div>
              <div className="nav-link" style={styles.navLink}>How It Works</div>
              <div className="nav-link" style={styles.navLink}>Pricing</div>
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <div className="nav-link" style={styles.navLink}>Dashboard</div>
              </Link>
              <button
                className="nav-button"
                style={styles.navButton}
                onClick={() => setIsDemoModalOpen(true)}
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={styles.hero}>
          <h1 style={styles.heroTitle}>
            Your Golf Course, Answered 24/7
          </h1>
          <p style={styles.heroSubtitle}>
            AI that knows your course inside and out. Answer questions, book tee times,
            and engage golfers around the clock—no staff required.
          </p>
          <div style={styles.heroCtaGroup}>
            <button
              className="primary-btn"
              style={styles.primaryButton}
              onClick={() => setShowFoxHollowChat(true)}
            >
              Try Fox Hollow Demo
            </button>
            <button
              className="secondary-btn"
              style={styles.secondaryButton}
              onClick={() => setIsDemoModalOpen(true)}
            >
              Upload Your Course
            </button>
          </div>
        </section>

        {/* Dual Demo Section */}
        <section style={styles.dualDemoSection}>
          <h2 style={styles.sectionTitle}>See It In Action</h2>
          <div className="dual-demo-grid" style={styles.dualDemoGrid}>
            {/* Fox Hollow Demo */}
            <div className="demo-card" style={styles.demoCard}>
              <div style={styles.demoCardTitle}>Fox Hollow Demo</div>
              <div style={styles.demoCardDescription}>
                Try our pre-built demo powered by Fox Hollow Golf Course data.
                Ask about rates, hours, or book a tee time.
              </div>
              <button
                className="demo-button"
                style={styles.demoButton}
                onClick={() => setShowFoxHollowChat(true)}
              >
                Try Fox Hollow Demo
              </button>
              <div style={styles.demoPreview}>
                25 free interactions • No sign-up required
              </div>
            </div>

            {/* Custom Demo */}
            <div className="demo-card" style={styles.demoCard}>
              <div style={styles.demoCardTitle}>Your Custom Demo</div>
              <div style={styles.demoCardDescription}>
                Upload your course info and get a personalized AI assistant trained
                on your exact details in minutes.
              </div>
              <button
                className="demo-button"
                style={styles.demoButton}
                onClick={() => setIsDemoModalOpen(true)}
              >
                Create Your Demo
              </button>
              <div style={styles.demoPreview}>
                5 minutes to set up • 25 free interactions
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section style={styles.howItWorksSection}>
          <div style={styles.howItWorksContent}>
            <h2 style={styles.sectionTitle}>How It Works</h2>
            <div className="steps-grid" style={styles.stepsGrid}>
              {steps.map((step) => (
                <div key={step.number} style={styles.step}>
                  <div style={styles.stepNumber}>{step.number}</div>
                  <div style={styles.stepTitle}>{step.title}</div>
                  <div style={styles.stepDescription}>{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={styles.featuresSection}>
          <h2 style={styles.sectionTitle}>Everything You Need</h2>
          <div className="features-grid" style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <div style={styles.featureTitle}>{feature.title}</div>
                <div style={styles.featureDescription}>{feature.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={styles.footerText}>
            © 2025 ProShop 24/7. Built for golf courses that never sleep.
          </div>
        </footer>

        {/* Fox Hollow Chat Overlay */}
        {showFoxHollowChat && (
          <div style={styles.chatOverlay} onClick={() => setShowFoxHollowChat(false)}>
            <div style={styles.chatContainer} onClick={(e) => e.stopPropagation()}>
              <button style={styles.closeButton} onClick={() => setShowFoxHollowChat(false)}>
                ✕
              </button>
              <ChatWidget
                demoSlug="fox-hollow"
                initialMessage="Hi! Welcome to Fox Hollow Golf Course. How can I help you today?"
              />
            </div>
          </div>
        )}

        {/* Custom Demo Chat Overlay - Will show after creation */}
        {showCustomChat && (
          <div style={styles.chatOverlay} onClick={() => setShowCustomChat(false)}>
            <div style={styles.chatContainer} onClick={(e) => e.stopPropagation()}>
              <button style={styles.closeButton} onClick={() => setShowCustomChat(false)}>
                ✕
              </button>
              <ChatWidget
                initialMessage="Hi! Welcome to your custom demo. How can I help you today?"
              />
            </div>
          </div>
        )}

        {/* Demo Creation Modal */}
        <DemoCreationModal
          isOpen={isDemoModalOpen}
          onClose={() => setIsDemoModalOpen(false)}
        />
      </div>
    </>
  );
};

export default LandingPage;
