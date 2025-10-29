/**
 * Landing Page - Starlink Space-Tech Theme
 * ProShop 24/7 - Global Connectivity for Golf
 */

import React, { useState, useEffect } from 'react';

export const LandingPage: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [courseName, setCourseName] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);

    try {
      const response = await fetch('/api/demo/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          course_name: courseName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Demo deployed!\n\nCall: ${phoneNumber}\nDemo ID: ${data.demo_id}`);
        setPhoneNumber('');
        setCourseName('');
      }
    } catch (error) {
      console.error('Deploy error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const styles = {
    page: {
      background: '#000000',
      minHeight: '100vh',
      color: '#ffffff',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative' as const,
      overflow: 'hidden',
    },

    // Starlink constellation pattern
    starlinkConstellation: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
        radial-gradient(2px 2px at 20% 30%, rgba(0, 102, 255, 0.15), transparent),
        radial-gradient(2px 2px at 60% 70%, rgba(0, 217, 255, 0.1), transparent),
        radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.1), transparent),
        radial-gradient(1px 1px at 80% 10%, rgba(0, 102, 255, 0.08), transparent),
        radial-gradient(2px 2px at 90% 60%, rgba(0, 217, 255, 0.12), transparent)
      `,
      backgroundSize: '200px 200px, 300px 300px, 150px 150px, 250px 250px, 180px 180px',
      pointerEvents: 'none' as const,
      zIndex: 1,
      animation: 'constellationFloat 60s ease-in-out infinite',
    },

    // Starlink blue satellite glow
    satelliteGlow: {
      position: 'fixed' as const,
      top: mousePosition.y - 600,
      left: mousePosition.x - 600,
      width: '1200px',
      height: '1200px',
      background: 'radial-gradient(circle, rgba(0, 102, 255, 0.15) 0%, rgba(0, 217, 255, 0.08) 30%, transparent 60%)',
      pointerEvents: 'none' as const,
      zIndex: 0,
      transition: 'top 0.6s cubic-bezier(0.075, 0.82, 0.165, 1), left 0.6s cubic-bezier(0.075, 0.82, 0.165, 1)',
      filter: 'blur(120px)',
    },

    // Space-tech data streams
    dataStreams: {
      position: 'fixed' as const,
      top: '20%',
      right: '-10%',
      width: '800px',
      height: '400px',
      opacity: 0.15,
      pointerEvents: 'none' as const,
      zIndex: 0,
    },

    // Content container
    content: {
      position: 'relative' as const,
      zIndex: 2,
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '0 40px',
    },

    // Navigation - Space-tech minimal
    nav: {
      position: 'sticky' as const,
      top: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '36px 0',
      marginBottom: '100px',
      background: scrollY > 50 ? 'rgba(0, 0, 0, 0.95)' : 'transparent',
      backdropFilter: scrollY > 50 ? 'blur(20px) saturate(180%)' : 'none',
      borderBottom: scrollY > 50 ? '1px solid rgba(0, 102, 255, 0.2)' : 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 100,
    },

    logo: {
      fontSize: '28px',
      fontWeight: 900,
      background: 'linear-gradient(135deg, #ffffff 0%, #0066FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.04em',
      textTransform: 'uppercase' as const,
    },

    navLinks: {
      display: 'flex',
      gap: '52px',
      alignItems: 'center',
    },

    navLink: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#9ca3af',
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative' as const,
    },

    // Hero - Championship mentality
    hero: {
      textAlign: 'center' as const,
      padding: '140px 0 180px',
      position: 'relative' as const,
    },

    heroKicker: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 28px',
      marginBottom: '40px',
      background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(0, 217, 255, 0.1) 100%)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 102, 255, 0.4)',
      borderRadius: '100px',
      fontSize: '11px',
      fontWeight: 800,
      color: '#00D9FF',
      textTransform: 'uppercase' as const,
      letterSpacing: '3px',
      boxShadow: '0 0 50px rgba(0, 102, 255, 0.3)',
    },

    heroTitle: {
      fontSize: '96px',
      fontWeight: 900,
      lineHeight: 1,
      marginBottom: '48px',
      letterSpacing: '-0.05em',
      background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 30%, #0066FF 70%, #00D9FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 0 100px rgba(0, 102, 255, 0.4)',
      textTransform: 'uppercase' as const,
    },

    heroSubtitle: {
      fontSize: '24px',
      fontWeight: 400,
      color: '#9ca3af',
      maxWidth: '880px',
      margin: '0 auto 64px',
      lineHeight: 1.6,
    },

    heroCtaGroup: {
      display: 'flex',
      gap: '28px',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '140px',
    },

    primaryButton: {
      padding: '24px 60px',
      background: 'linear-gradient(135deg, #0066FF 0%, #00D9FF 100%)',
      border: 'none',
      borderRadius: '4px',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: 900,
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 0 60px rgba(0, 102, 255, 0.5), 0 10px 40px rgba(0, 0, 0, 0.4)',
      position: 'relative' as const,
      overflow: 'hidden',
    },

    secondaryButton: {
      padding: '24px 60px',
      background: 'transparent',
      border: '2px solid rgba(0, 102, 255, 0.5)',
      borderRadius: '4px',
      color: '#0066FF',
      fontSize: '13px',
      fontWeight: 900,
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Stats - Championship stats
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '2px',
      background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(0, 217, 255, 0.15) 100%)',
      borderRadius: '4px',
      padding: '2px',
      marginBottom: '180px',
      boxShadow: '0 0 100px rgba(0, 102, 255, 0.25), inset 0 0 80px rgba(0, 102, 255, 0.08)',
    },

    statCard: {
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 5, 5, 0.9) 100%)',
      backdropFilter: 'blur(20px) saturate(180%)',
      padding: '72px 48px',
      textAlign: 'center' as const,
      borderRadius: '2px',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden',
      border: '1px solid rgba(0, 102, 255, 0.15)',
    },

    statChampionshipBadge: {
      position: 'absolute' as const,
      top: '20px',
      right: '20px',
      fontSize: '32px',
      opacity: 0.2,
    },

    statValue: {
      fontSize: '72px',
      fontWeight: 900,
      marginBottom: '16px',
      letterSpacing: '-0.04em',
      background: 'linear-gradient(135deg, #ffffff 0%, #0066FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },

    statLabel: {
      fontSize: '10px',
      fontWeight: 800,
      color: '#6b7280',
      textTransform: 'uppercase' as const,
      letterSpacing: '3px',
    },

    // Problems section
    problemsSection: {
      marginBottom: '180px',
      position: 'relative' as const,
    },

    sectionKicker: {
      fontSize: '11px',
      fontWeight: 800,
      color: '#0066FF',
      textTransform: 'uppercase' as const,
      letterSpacing: '3.5px',
      marginBottom: '28px',
      textAlign: 'center' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    },

    sectionTitle: {
      fontSize: '84px',
      fontWeight: 900,
      textAlign: 'center' as const,
      marginBottom: '100px',
      letterSpacing: '-0.05em',
      background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 40%, #0066FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textTransform: 'uppercase' as const,
    },

    problemsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '32px',
    },

    problemCard: {
      position: 'relative' as const,
      background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 217, 255, 0.05) 100%)',
      backdropFilter: 'blur(25px) saturate(180%)',
      border: '1px solid rgba(0, 102, 255, 0.2)',
      borderRadius: '4px',
      padding: '60px',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      overflow: 'hidden',
    },

    problemNumber: {
      fontSize: '13px',
      fontWeight: 900,
      color: '#0066FF',
      marginBottom: '28px',
      letterSpacing: '3.5px',
      textTransform: 'uppercase' as const,
    },

    problemTitle: {
      fontSize: '36px',
      fontWeight: 900,
      color: '#ffffff',
      marginBottom: '24px',
      letterSpacing: '-0.03em',
      textTransform: 'uppercase' as const,
    },

    problemDescription: {
      fontSize: '17px',
      fontWeight: 400,
      color: '#9ca3af',
      lineHeight: 1.8,
      marginBottom: '32px',
    },

    problemStat: {
      fontSize: '48px',
      fontWeight: 900,
      background: 'linear-gradient(135deg, #ffffff 0%, #0066FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.03em',
      textTransform: 'uppercase' as const,
    },

    // Championship section
    championshipSection: {
      position: 'relative' as const,
      textAlign: 'center' as const,
      marginBottom: '180px',
      padding: '140px 120px',
      background: `
        linear-gradient(135deg, rgba(0, 102, 255, 0.15) 0%, rgba(0, 217, 255, 0.08) 100%),
        repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(0, 102, 255, 0.03) 15px, rgba(0, 102, 255, 0.03) 30px)
      `,
      backdropFilter: 'blur(30px) saturate(180%)',
      border: '2px solid rgba(0, 102, 255, 0.3)',
      borderRadius: '4px',
      boxShadow: '0 0 120px rgba(0, 102, 255, 0.25)',
      overflow: 'hidden',
    },

    championshipContent: {
      position: 'relative' as const,
      zIndex: 1,
    },

    championshipIcon: {
      fontSize: '80px',
      marginBottom: '48px',
      filter: 'drop-shadow(0 0 30px rgba(0, 102, 255, 0.4))',
    },

    championshipTitle: {
      fontSize: '88px',
      fontWeight: 900,
      marginBottom: '56px',
      letterSpacing: '-0.05em',
      background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 30%, #0066FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textTransform: 'uppercase' as const,
    },

    championshipText: {
      fontSize: '24px',
      fontWeight: 400,
      color: '#9ca3af',
      maxWidth: '1000px',
      margin: '0 auto',
      lineHeight: 1.9,
    },

    // Features - Performance features
    featuresSection: {
      marginBottom: '180px',
    },

    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '2px',
      background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(0, 217, 255, 0.15) 100%)',
      borderRadius: '4px',
      padding: '2px',
    },

    featureCard: {
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 5, 5, 0.9) 100%)',
      backdropFilter: 'blur(20px) saturate(180%)',
      padding: '72px',
      borderRadius: '2px',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden',
      border: '1px solid rgba(0, 102, 255, 0.15)',
    },

    featurePerformanceBadge: {
      position: 'absolute' as const,
      top: '28px',
      right: '28px',
      padding: '8px 16px',
      background: 'rgba(0, 102, 255, 0.2)',
      border: '1px solid rgba(0, 102, 255, 0.4)',
      borderRadius: '2px',
      fontSize: '11px',
      fontWeight: 900,
      color: '#0066FF',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
    },

    featureIcon: {
      fontSize: '64px',
      marginBottom: '36px',
      display: 'inline-block',
      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      filter: 'drop-shadow(0 0 20px rgba(0, 102, 255, 0.3))',
    },

    featureTitle: {
      fontSize: '28px',
      fontWeight: 900,
      color: '#ffffff',
      marginBottom: '20px',
      letterSpacing: '-0.03em',
      textTransform: 'uppercase' as const,
    },

    featureDescription: {
      fontSize: '17px',
      fontWeight: 400,
      color: '#9ca3af',
      lineHeight: 1.8,
    },

    // Demo section - Championship signup
    demoSection: {
      maxWidth: '840px',
      margin: '0 auto 180px',
      padding: '100px',
      background: `
        linear-gradient(135deg, rgba(0, 102, 255, 0.18) 0%, rgba(0, 217, 255, 0.1) 100%),
        radial-gradient(ellipse at top, rgba(0, 102, 255, 0.12) 0%, transparent 50%)
      `,
      backdropFilter: 'blur(30px) saturate(180%)',
      border: '2px solid rgba(0, 102, 255, 0.35)',
      borderRadius: '4px',
      boxShadow: '0 0 120px rgba(0, 102, 255, 0.3)',
      position: 'relative' as const,
      overflow: 'hidden',
    },

    demoContent: {
      position: 'relative' as const,
      zIndex: 1,
    },

    demoTitle: {
      fontSize: '64px',
      fontWeight: 900,
      marginBottom: '28px',
      textAlign: 'center' as const,
      letterSpacing: '-0.04em',
      background: 'linear-gradient(135deg, #ffffff 0%, #0066FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textTransform: 'uppercase' as const,
    },

    demoSubtitle: {
      fontSize: '19px',
      fontWeight: 400,
      color: '#9ca3af',
      marginBottom: '60px',
      textAlign: 'center' as const,
      lineHeight: 1.8,
    },

    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '36px',
    },

    inputGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },

    label: {
      fontSize: '11px',
      fontWeight: 900,
      color: '#0066FF',
      textTransform: 'uppercase' as const,
      letterSpacing: '3px',
    },

    input: {
      background: 'rgba(0, 102, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 102, 255, 0.3)',
      borderRadius: '4px',
      padding: '24px',
      fontSize: '18px',
      fontWeight: 500,
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.3s ease',
    },

    submitButton: {
      padding: '26px 60px',
      background: 'linear-gradient(135deg, #0066FF 0%, #00D9FF 100%)',
      border: 'none',
      borderRadius: '4px',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: 900,
      textTransform: 'uppercase' as const,
      letterSpacing: '2px',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      marginTop: '28px',
      boxShadow: '0 0 60px rgba(0, 102, 255, 0.5)',
    },

    // Footer
    footer: {
      borderTop: '1px solid rgba(0, 102, 255, 0.2)',
      padding: '100px 0',
      textAlign: 'center' as const,
    },

    footerText: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#6b7280',
      letterSpacing: '1px',
      textTransform: 'uppercase' as const,
    },
  };

  const problems = [
    {
      number: 'PROBLEM 01',
      title: 'After-Hours Blackout',
      description: 'Course closed. Phones dead. Revenue bleeding out. 67% of your calls come when nobody\'s there. Every voicemail is money you\'ll never see.',
      stat: '67% LOST',
    },
    {
      number: 'PROBLEM 02',
      title: 'Burnout Zone',
      description: 'Your staff answering the same damn questions 40 times per shift. This isn\'t customer service. It\'s Groundhog Day. Let AI handle it.',
      stat: '40+ LOOPS',
    },
    {
      number: 'PROBLEM 03',
      title: 'Zero Memory',
      description: 'Regular caller. Third time this week. Your team has no clue who they are. No history. No context. Just awkward silence and apologies.',
      stat: 'NO DATA',
    },
    {
      number: 'PROBLEM 04',
      title: 'Revenue Drain',
      description: 'Every missed call is $300 gone. Every botched booking is a member who never comes back. The math is brutal. Fix it or lose.',
      stat: '$42K/YEAR',
    },
    {
      number: 'PROBLEM 05',
      title: 'Voicemail Trap',
      description: 'You call back 2 hours later. They already booked somewhere else. Your tee times stay empty. Theirs are full. That\'s the game.',
      stat: '73% GONE',
    },
  ];

  const features = [
    {
      icon: '🔥',
      title: '24/7 Dominance',
      description: 'AI that never sleeps. Never quits. Never misses. Books tee times at 3am while you\'re dreaming of championships.',
      badge: 'ELITE',
    },
    {
      icon: '🏆',
      title: 'Total Recall',
      description: 'Every caller\'s history at your fingertips. Handicaps. Preferences. Bookings. Turn casuals into champions.',
      badge: 'PRO',
    },
    {
      icon: '⚡',
      title: 'Instant Deploy',
      description: 'Forward your number. Live in 60 seconds. No IT team. No consultants. No excuses. Just performance.',
      badge: 'FAST',
    },
    {
      icon: '📈',
      title: 'Championship Analytics',
      description: 'Real-time dashboards. Call volume. Conversion rates. Revenue per call. Know your numbers like Tiger knows Augusta.',
      badge: 'DATA',
    },
    {
      icon: '🎯',
      title: 'Full Control',
      description: 'Review every call. Listen to recordings. Override decisions. You\'re the coach. AI is the player.',
      badge: 'POWER',
    },
    {
      icon: '🏌️',
      title: 'Golf DNA',
      description: 'Trained on championship golf ops. Knows Nassau from Stableford. Speaks fluent golf. Performs like Sunday Red.',
      badge: 'EXPERT',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes swoosh {
          0%, 100% { transform: translateX(0) skewX(0deg); }
          50% { transform: translateX(10px) skewX(-5deg); }
        }

        @keyframes championPulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .stat-card:hover {
          transform: translateY(-16px) scale(1.04);
          box-shadow: 0 0 120px rgba(0, 102, 255, 0.5);
          border-color: rgba(0, 102, 255, 0.4);
        }

        .stat-card:hover .champion-badge {
          opacity: 0.6;
          animation: championPulse 2s ease-in-out infinite;
        }

        .problem-card:hover {
          transform: translateY(-20px) scale(1.03);
          border-color: rgba(0, 102, 255, 0.5);
          box-shadow: 0 30px 80px rgba(0, 102, 255, 0.3);
          background: linear-gradient(135deg, rgba(0, 102, 255, 0.18) 0%, rgba(0, 217, 255, 0.1) 100%);
        }

        .feature-card:hover {
          transform: scale(1.08);
          box-shadow: 0 0 100px rgba(0, 102, 255, 0.4);
          border-color: rgba(0, 102, 255, 0.4);
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.4) rotate(8deg);
          animation: swoosh 1s ease-in-out;
        }

        .feature-card:hover .perf-badge {
          opacity: 1;
          transform: scale(1.1);
        }

        .primary-btn:hover {
          transform: translateY(-8px) scale(1.08);
          box-shadow: 0 0 100px rgba(0, 102, 255, 0.7), 0 25px 60px rgba(0, 0, 0, 0.5);
        }

        .primary-btn:active {
          transform: translateY(-4px) scale(1.04);
        }

        .secondary-btn:hover {
          background: rgba(0, 102, 255, 0.15);
          border-color: rgba(0, 102, 255, 0.8);
          color: #ffffff;
          transform: translateY(-8px);
        }

        .nav-link:hover {
          color: #0066FF;
        }

        .nav-link::after {
          content: '';
          position: 'absolute';
          bottom: -8px;
          left: 0;
          width: 0;
          height: 3px;
          background: linear-gradient(90deg, #0066FF, #00D9FF);
          transition: width 0.4s ease;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        input:focus {
          border-color: rgba(0, 102, 255, 0.6);
          box-shadow: 0 0 0 6px rgba(0, 102, 255, 0.2);
          background: rgba(0, 102, 255, 0.15);
        }

        input::placeholder {
          color: rgba(156, 163, 175, 0.4);
        }

        .submit-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 80px rgba(0, 102, 255, 0.7);
        }

        .submit-btn:active {
          transform: scale(1.03);
        }
      `}</style>

      <div style={styles.page}>
        {/* Nike slashes */}
        <div style={styles.nikeSlashes} />

        {/* Championship glow */}
        <div style={styles.championshipGlow} />

        {/* Performance lines as SVG */}
        <svg style={styles.performanceLines} viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,100 L800,50" stroke="rgba(0, 102, 255, 0.15)" strokeWidth="2" />
          <path d="M0,200 L800,150" stroke="rgba(0, 102, 255, 0.12)" strokeWidth="2" />
          <path d="M0,300 L800,250" stroke="rgba(0, 102, 255, 0.1)" strokeWidth="2" />
        </svg>

        <div style={styles.content}>
          {/* Navigation */}
          <nav style={styles.nav}>
            <div style={styles.logo}>PROSHOP 24/7</div>
            <div style={styles.navLinks}>
              <div className="nav-link" style={styles.navLink}>Platform</div>
              <div className="nav-link" style={styles.navLink}>Technology</div>
              <div className="nav-link" style={styles.navLink}>Pricing</div>
              <button
                className="primary-btn"
                style={styles.primaryButton}
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started
              </button>
            </div>
          </nav>

          {/* Hero */}
          <section style={styles.hero}>
            <div style={styles.heroKicker}>
              CHAMPIONSHIP-LEVEL AI
            </div>
            <h1 style={styles.heroTitle}>
              DOMINATE<br />EVERY CALL
            </h1>
            <p style={styles.heroSubtitle}>
              The AI receptionist that performs when it matters most. Answer every call, close every booking,
              capture every opportunity. Built for courses that refuse to lose revenue. Just Win.
            </p>
            <div style={styles.heroCtaGroup}>
              <button
                className="primary-btn"
                style={styles.primaryButton}
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Deploy Now
              </button>
              <button className="secondary-btn" style={styles.secondaryButton}>
                Watch Demo
              </button>
            </div>
          </section>

          {/* Stats */}
          <div style={styles.statsGrid}>
            <div className="stat-card" style={styles.statCard}>
              <div className="champion-badge" style={styles.statChampionshipBadge}>🏆</div>
              <div style={styles.statValue}>24/7</div>
              <div style={styles.statLabel}>Championship Mode</div>
            </div>
            <div className="stat-card" style={styles.statCard}>
              <div className="champion-badge" style={styles.statChampionshipBadge}>🔥</div>
              <div style={styles.statValue}>100%</div>
              <div style={styles.statLabel}>Performance Rate</div>
            </div>
            <div className="stat-card" style={styles.statCard}>
              <div className="champion-badge" style={styles.statChampionshipBadge}>⚡</div>
              <div style={styles.statValue}>&lt;2s</div>
              <div style={styles.statLabel}>Response Time</div>
            </div>
            <div className="stat-card" style={styles.statCard}>
              <div className="champion-badge" style={styles.statChampionshipBadge}>📈</div>
              <div style={styles.statValue}>+89%</div>
              <div style={styles.statLabel}>Win Rate</div>
            </div>
          </div>

          {/* Problems */}
          <section style={styles.problemsSection}>
            <div style={styles.sectionKicker}>
              WHAT'S KILLING YOUR GAME
            </div>
            <h2 style={styles.sectionTitle}>5 PROBLEMS WE FIX</h2>
            <div style={styles.problemsGrid}>
              {problems.map((problem, index) => (
                <div key={index} className="problem-card" style={styles.problemCard}>
                  <div style={styles.problemNumber}>{problem.number}</div>
                  <div style={styles.problemTitle}>{problem.title}</div>
                  <div style={styles.problemDescription}>{problem.description}</div>
                  <div style={styles.problemStat}>{problem.stat}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Championship */}
          <section style={styles.championshipSection}>
            <div style={styles.championshipContent}>
              <div style={styles.championshipIcon}>🏆</div>
              <h2 style={styles.championshipTitle}>BUILT TO WIN</h2>
              <p style={styles.championshipText}>
                We don't build software. We build champions. Every line of code is engineered for peak performance.
                Every feature is designed to dominate. Like Sunday Red on the back nine—we show up when it matters most.
                This is championship-level AI for championship-level operations.
              </p>
            </div>
          </section>

          {/* Features */}
          <section style={styles.featuresSection}>
            <div style={styles.sectionKicker}>
              PERFORMANCE FEATURES
            </div>
            <h2 style={styles.sectionTitle}>HOW WE DOMINATE</h2>
            <div style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <div key={index} className="feature-card" style={styles.featureCard}>
                  <div className="perf-badge" style={styles.featurePerformanceBadge}>{feature.badge}</div>
                  <div className="feature-icon" style={styles.featureIcon}>{feature.icon}</div>
                  <div style={styles.featureTitle}>{feature.title}</div>
                  <div style={styles.featureDescription}>{feature.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Demo */}
          <section id="demo" style={styles.demoSection}>
            <div style={styles.demoContent}>
              <h2 style={styles.demoTitle}>START WINNING</h2>
              <p style={styles.demoSubtitle}>
                Deploy your championship AI in 60 seconds. No credit card. No excuses. Just results.
              </p>
              <form onSubmit={handleDeploy} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Course Name</label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Augusta National"
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                    style={styles.input}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDeploying}
                  className="submit-btn"
                  style={styles.submitButton}
                >
                  {isDeploying ? 'DEPLOYING...' : 'DEPLOY NOW'}
                </button>
              </form>
            </div>
          </section>

          {/* Footer */}
          <footer style={styles.footer}>
            <p style={styles.footerText}>
              © 2025 ProShop 24/7 · Championship AI for Championship Courses
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
