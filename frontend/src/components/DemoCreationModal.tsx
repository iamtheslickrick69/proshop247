/**
 * Demo Creation Modal - 3-Step Form
 * ProShop 24/7 - Create custom golf course demos
 */

import React, { useState } from 'react';
import { whiteTheme } from '../lib/white-theme';
import { demoAPI, type CreateDemoRequest } from '../lib/api';

interface DemoCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'basic' | 'files' | 'details' | 'success';

export const DemoCreationModal: React.FC<DemoCreationModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [courseName, setCourseName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Files (optional)
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [scorecardFile, setScorecardFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Success data
  const [demoUrl, setDemoUrl] = useState('');
  const [demoSlug, setDemoSlug] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset form
    setCurrentStep('basic');
    setCourseName('');
    setLocation('');
    setWebsite('');
    setEmail('');
    setPhone('');
    setMenuFile(null);
    setScorecardFile(null);
    setLogoFile(null);
    setDemoUrl('');
    setDemoSlug('');
    setError(null);
    onClose();
  };

  const handleNext = () => {
    if (currentStep === 'basic') {
      if (!courseName || !website || !email) {
        setError('Please fill in all required fields');
        return;
      }
      setError(null);
      setCurrentStep('files');
    } else if (currentStep === 'files') {
      setCurrentStep('details');
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'files') {
      setCurrentStep('basic');
    } else if (currentStep === 'details') {
      setCurrentStep('files');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: CreateDemoRequest = {
        course_name: courseName,
        website_url: website,
        email: email,
      };

      const response = await demoAPI.createDemo(request);
      setDemoUrl(response.demo_url);
      setDemoSlug(response.slug);
      setCurrentStep('success');
    } catch (err) {
      setError('Failed to create demo. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(demoUrl);
    alert('Demo URL copied to clipboard!');
  };

  const styles = {
    overlay: {
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

    modal: {
      background: whiteTheme.bg.primary,
      borderRadius: '12px',
      boxShadow: whiteTheme.shadow.xl,
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
    },

    header: {
      padding: '24px 32px',
      borderBottom: `1px solid ${whiteTheme.border.base}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    title: {
      fontSize: '20px',
      fontWeight: 600,
      color: whiteTheme.text.primary,
    },

    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: whiteTheme.text.tertiary,
      cursor: 'pointer',
      padding: '4px',
      lineHeight: 1,
    },

    stepIndicator: {
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      padding: '24px 32px 0',
    },

    stepDot: (active: boolean) => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: active ? whiteTheme.accent.blue : whiteTheme.border.medium,
      transition: 'all 0.2s ease',
    }),

    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '32px',
    },

    formGroup: {
      marginBottom: '24px',
    },

    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 500,
      color: whiteTheme.text.primary,
      marginBottom: '8px',
    },

    required: {
      color: whiteTheme.accent.red,
      marginLeft: '4px',
    },

    input: {
      width: '100%',
      padding: '10px 12px',
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '6px',
      fontSize: '14px',
      color: whiteTheme.text.primary,
      background: whiteTheme.bg.primary,
      outline: 'none',
      transition: 'all 0.2s ease',
    },

    helpText: {
      fontSize: '12px',
      color: whiteTheme.text.tertiary,
      marginTop: '6px',
    },

    fileInput: {
      display: 'none',
    },

    fileButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '6px',
      background: whiteTheme.bg.secondary,
      color: whiteTheme.text.primary,
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },

    fileName: {
      fontSize: '12px',
      color: whiteTheme.text.secondary,
      marginTop: '6px',
    },

    errorMessage: {
      background: '#FEE2E2',
      border: `1px solid ${whiteTheme.accent.red}`,
      borderRadius: '6px',
      padding: '12px',
      fontSize: '14px',
      color: whiteTheme.accent.red,
      marginBottom: '24px',
    },

    footer: {
      padding: '24px 32px',
      borderTop: `1px solid ${whiteTheme.border.base}`,
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
    },

    button: {
      padding: '10px 20px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
    },

    primaryButton: {
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
    },

    secondaryButton: {
      background: whiteTheme.bg.secondary,
      color: whiteTheme.text.primary,
      border: `1px solid ${whiteTheme.border.base}`,
    },

    successIcon: {
      fontSize: '64px',
      textAlign: 'center' as const,
      marginBottom: '24px',
    },

    successTitle: {
      fontSize: '24px',
      fontWeight: 600,
      textAlign: 'center' as const,
      color: whiteTheme.text.primary,
      marginBottom: '12px',
    },

    successMessage: {
      fontSize: '14px',
      color: whiteTheme.text.secondary,
      textAlign: 'center' as const,
      marginBottom: '32px',
      lineHeight: 1.6,
    },

    urlBox: {
      background: whiteTheme.bg.secondary,
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
    },

    urlText: {
      fontSize: '14px',
      color: whiteTheme.accent.blue,
      wordBreak: 'break-all' as const,
      marginBottom: '12px',
    },

    copyButton: {
      width: '100%',
      padding: '10px 20px',
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
    },
  };

  const renderBasicInfo = () => (
    <>
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Course Name
          <span style={styles.required}>*</span>
        </label>
        <input
          type="text"
          style={styles.input}
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="e.g., Pebble Beach Golf Links"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>
          Location
        </label>
        <input
          type="text"
          style={styles.input}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., San Francisco, CA"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>
          Website URL
          <span style={styles.required}>*</span>
        </label>
        <input
          type="url"
          style={styles.input}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yourcoursename.com"
        />
        <div style={styles.helpText}>
          We'll scrape your website to learn about your course
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>
          Email
          <span style={styles.required}>*</span>
        </label>
        <input
          type="email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@golfcourse.com"
        />
        <div style={styles.helpText}>
          We'll send your demo link here
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>
          Phone (Optional)
        </label>
        <input
          type="tel"
          style={styles.input}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 123-4567"
        />
      </div>
    </>
  );

  const renderFiles = () => (
    <>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: whiteTheme.text.secondary, lineHeight: 1.6 }}>
          Upload additional files to help our AI better understand your course.
          All files are optional but will improve accuracy.
        </p>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Menu / Price List (Optional)</label>
        <input
          type="file"
          id="menu-file"
          style={styles.fileInput}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="menu-file" style={styles.fileButton}>
          📄 Choose File
        </label>
        {menuFile && <div style={styles.fileName}>{menuFile.name}</div>}
        <div style={styles.helpText}>PDF, JPG, or PNG</div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Scorecard (Optional)</label>
        <input
          type="file"
          id="scorecard-file"
          style={styles.fileInput}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setScorecardFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="scorecard-file" style={styles.fileButton}>
          📄 Choose File
        </label>
        {scorecardFile && <div style={styles.fileName}>{scorecardFile.name}</div>}
        <div style={styles.helpText}>PDF, JPG, or PNG</div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Course Logo (Optional)</label>
        <input
          type="file"
          id="logo-file"
          style={styles.fileInput}
          accept=".jpg,.jpeg,.png,.svg"
          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="logo-file" style={styles.fileButton}>
          🖼️ Choose File
        </label>
        {logoFile && <div style={styles.fileName}>{logoFile.name}</div>}
        <div style={styles.helpText}>JPG, PNG, or SVG</div>
      </div>
    </>
  );

  const renderDetails = () => (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: whiteTheme.text.primary }}>
          Review Your Information
        </h3>

        <div style={{ ...styles.urlBox, marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: whiteTheme.text.tertiary, marginBottom: '4px' }}>Course Name</div>
          <div style={{ fontSize: '14px', color: whiteTheme.text.primary }}>{courseName}</div>
        </div>

        {location && (
          <div style={{ ...styles.urlBox, marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: whiteTheme.text.tertiary, marginBottom: '4px' }}>Location</div>
            <div style={{ fontSize: '14px', color: whiteTheme.text.primary }}>{location}</div>
          </div>
        )}

        <div style={{ ...styles.urlBox, marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: whiteTheme.text.tertiary, marginBottom: '4px' }}>Website</div>
          <div style={{ fontSize: '14px', color: whiteTheme.text.primary }}>{website}</div>
        </div>

        <div style={{ ...styles.urlBox, marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: whiteTheme.text.tertiary, marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '14px', color: whiteTheme.text.primary }}>{email}</div>
        </div>

        {(menuFile || scorecardFile || logoFile) && (
          <div style={{ ...styles.urlBox }}>
            <div style={{ fontSize: '12px', color: whiteTheme.text.tertiary, marginBottom: '8px' }}>Files Uploaded</div>
            {menuFile && <div style={{ fontSize: '13px', color: whiteTheme.text.secondary }}>✓ Menu</div>}
            {scorecardFile && <div style={{ fontSize: '13px', color: whiteTheme.text.secondary }}>✓ Scorecard</div>}
            {logoFile && <div style={{ fontSize: '13px', color: whiteTheme.text.secondary }}>✓ Logo</div>}
          </div>
        )}
      </div>

      <div style={{ background: whiteTheme.bg.tertiary, borderRadius: '8px', padding: '16px', fontSize: '13px', color: whiteTheme.text.secondary, lineHeight: 1.6 }}>
        🎉 Your demo will be ready in about 2-3 minutes. We'll analyze your website
        and create a custom AI assistant trained on your course details.
      </div>
    </>
  );

  const renderSuccess = () => (
    <>
      <div style={styles.successIcon}>✅</div>
      <h3 style={styles.successTitle}>Demo Created Successfully!</h3>
      <p style={styles.successMessage}>
        Your custom demo is ready. Share this link to let golfers try out your AI assistant.
        You have 25 free interactions to test it out.
      </p>

      <div style={styles.urlBox}>
        <div style={{ fontSize: '12px', color: whiteTheme.text.tertiary, marginBottom: '8px' }}>
          Your Demo URL
        </div>
        <div style={styles.urlText}>{demoUrl}</div>
        <button style={styles.copyButton} onClick={copyToClipboard}>
          📋 Copy Link
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <a
          href={`/demo/${demoSlug}`}
          style={{
            color: whiteTheme.accent.blue,
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Try Your Demo Now →
        </a>
      </div>
    </>
  );

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>
            {currentStep === 'basic' && 'Create Your Demo'}
            {currentStep === 'files' && 'Upload Files (Optional)'}
            {currentStep === 'details' && 'Review & Submit'}
            {currentStep === 'success' && 'Demo Ready!'}
          </div>
          <button style={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        {currentStep !== 'success' && (
          <div style={styles.stepIndicator}>
            <div style={styles.stepDot(currentStep === 'basic')} />
            <div style={styles.stepDot(currentStep === 'files')} />
            <div style={styles.stepDot(currentStep === 'details')} />
          </div>
        )}

        <div style={styles.content}>
          {error && <div style={styles.errorMessage}>{error}</div>}

          {currentStep === 'basic' && renderBasicInfo()}
          {currentStep === 'files' && renderFiles()}
          {currentStep === 'details' && renderDetails()}
          {currentStep === 'success' && renderSuccess()}
        </div>

        {currentStep !== 'success' && (
          <div style={styles.footer}>
            <div>
              {currentStep !== 'basic' && (
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  ← Back
                </button>
              )}
            </div>
            <div>
              {currentStep !== 'details' ? (
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleNext}
                >
                  Next →
                </button>
              ) : (
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Demo...' : 'Create Demo'}
                </button>
              )}
            </div>
          </div>
        )}

        {currentStep === 'success' && (
          <div style={styles.footer}>
            <button
              style={{ ...styles.button, ...styles.primaryButton, flex: 1 }}
              onClick={handleClose}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoCreationModal;
