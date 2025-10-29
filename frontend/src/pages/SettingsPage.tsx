/**
 * Settings Page - Agent Configuration
 * Linear-style settings interface for golf course operators
 */

import React, { useState } from 'react';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Button, Card, Input } from '../components/ui';
import { colors, spacing, typography } from '../lib/design-system';

export const SettingsPage: React.FC = () => {
  const [activeRoute] = useState('/settings');
  const [isSaving, setIsSaving] = useState(false);

  // Mock settings data - will be replaced with API calls
  const [settings, setSettings] = useState({
    businessName: 'Fox Hollow Golf Course',
    phoneNumber: '+1 (555) 123-4567',
    website: 'https://foxhollowgolf.com',
    email: 'info@foxhollowgolf.com',

    // Business hours
    hoursWeekday: '7:00 AM - 8:00 PM',
    hoursWeekend: '6:00 AM - 9:00 PM',

    // Voice settings
    voiceGender: 'female',
    voiceSpeed: 'normal',
    agentName: 'Sarah',

    // Agent behavior
    agentPersonality: 'friendly',
    bookingEnabled: true,
    maxCallDuration: '10',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

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
    },

    title: {
      fontSize: '32px',
      fontWeight: 600,
      color: colors.text.primary,
      letterSpacing: '-0.02em',
      marginBottom: spacing[2],
    },

    subtitle: {
      fontSize: '14px',
      color: colors.text.secondary,
    },

    section: {
      marginBottom: spacing[6],
    },

    sectionTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: colors.text.primary,
      marginBottom: spacing[4],
    },

    sectionDescription: {
      fontSize: '14px',
      color: colors.text.secondary,
      marginBottom: spacing[4],
    },

    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: spacing[4],
    },

    formField: {
      marginBottom: spacing[4],
    },

    radioGroup: {
      display: 'flex',
      gap: spacing[3],
      marginTop: spacing[2],
    },

    radioOption: (isSelected: boolean) => ({
      padding: `${spacing[3]} ${spacing[4]}`,
      border: `1px solid ${isSelected ? colors.accent.blue : colors.border.base}`,
      borderRadius: '6px',
      background: isSelected ? colors.accent.blue + '08' : colors.bg.primary,
      cursor: 'pointer',
      transition: 'all 0.1s ease',
      fontSize: '14px',
      fontWeight: 500,
      color: isSelected ? colors.accent.blue : colors.text.secondary,
    }),

    toggleRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: `${spacing[3]} 0`,
      borderBottom: `1px solid ${colors.border.base}`,
    },

    toggleLabel: {
      fontSize: '14px',
      fontWeight: 500,
      color: colors.text.primary,
    },

    toggleDescription: {
      fontSize: '12px',
      color: colors.text.tertiary,
      marginTop: spacing[1],
    },

    toggle: (isOn: boolean) => ({
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      background: isOn ? colors.accent.blue : colors.bg.tertiary,
      position: 'relative' as const,
      cursor: 'pointer',
      transition: 'background 0.2s ease',
    }),

    toggleKnob: (isOn: boolean) => ({
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: 'white',
      position: 'absolute' as const,
      top: '3px',
      left: isOn ? '23px' : '3px',
      transition: 'left 0.2s ease',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }),

    saveBar: {
      position: 'fixed' as const,
      bottom: 0,
      left: '240px',
      right: 0,
      background: colors.bg.primary,
      borderTop: `1px solid ${colors.border.base}`,
      padding: `${spacing[4]} ${spacing[8]}`,
      display: 'flex',
      justifyContent: 'flex-end',
      gap: spacing[3],
      zIndex: 50,
    },
  };

  return (
    <div style={styles.container}>
      <Sidebar activeRoute={activeRoute} />

      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Configure your AI agent and business details</p>
        </div>

        {/* Business Information */}
        <div style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>Business Information</h2>
            <p style={styles.sectionDescription}>
              Basic information about your golf course
            </p>

            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <Input
                  label="Business Name"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                />
              </div>

              <div style={styles.formField}>
                <Input
                  label="Phone Number"
                  value={settings.phoneNumber}
                  onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                />
              </div>

              <div style={styles.formField}>
                <Input
                  label="Website"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                />
              </div>

              <div style={styles.formField}>
                <Input
                  label="Email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Business Hours */}
        <div style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>Business Hours</h2>
            <p style={styles.sectionDescription}>
              When your golf course is open for business
            </p>

            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <Input
                  label="Weekday Hours (Mon-Fri)"
                  placeholder="7:00 AM - 8:00 PM"
                  value={settings.hoursWeekday}
                  onChange={(e) => setSettings({ ...settings, hoursWeekday: e.target.value })}
                />
              </div>

              <div style={styles.formField}>
                <Input
                  label="Weekend Hours (Sat-Sun)"
                  placeholder="6:00 AM - 9:00 PM"
                  value={settings.hoursWeekend}
                  onChange={(e) => setSettings({ ...settings, hoursWeekend: e.target.value })}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Voice Settings */}
        <div style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>Voice & Agent Settings</h2>
            <p style={styles.sectionDescription}>
              Customize how your AI agent sounds and behaves
            </p>

            <div style={styles.formField}>
              <Input
                label="Agent Name"
                placeholder="Sarah"
                value={settings.agentName}
                onChange={(e) => setSettings({ ...settings, agentName: e.target.value })}
              />
            </div>

            <div style={styles.formField}>
              <label style={{
                ...typography.micro,
                color: colors.text.tertiary,
                display: 'block',
                marginBottom: spacing[2],
                fontWeight: 500,
              }}>
                VOICE GENDER
              </label>
              <div style={styles.radioGroup}>
                <div
                  style={styles.radioOption(settings.voiceGender === 'female')}
                  onClick={() => setSettings({ ...settings, voiceGender: 'female' })}
                >
                  Female
                </div>
                <div
                  style={styles.radioOption(settings.voiceGender === 'male')}
                  onClick={() => setSettings({ ...settings, voiceGender: 'male' })}
                >
                  Male
                </div>
              </div>
            </div>

            <div style={styles.formField}>
              <label style={{
                ...typography.micro,
                color: colors.text.tertiary,
                display: 'block',
                marginBottom: spacing[2],
                fontWeight: 500,
              }}>
                VOICE SPEED
              </label>
              <div style={styles.radioGroup}>
                <div
                  style={styles.radioOption(settings.voiceSpeed === 'slow')}
                  onClick={() => setSettings({ ...settings, voiceSpeed: 'slow' })}
                >
                  Slow
                </div>
                <div
                  style={styles.radioOption(settings.voiceSpeed === 'normal')}
                  onClick={() => setSettings({ ...settings, voiceSpeed: 'normal' })}
                >
                  Normal
                </div>
                <div
                  style={styles.radioOption(settings.voiceSpeed === 'fast')}
                  onClick={() => setSettings({ ...settings, voiceSpeed: 'fast' })}
                >
                  Fast
                </div>
              </div>
            </div>

            <div style={styles.formField}>
              <label style={{
                ...typography.micro,
                color: colors.text.tertiary,
                display: 'block',
                marginBottom: spacing[2],
                fontWeight: 500,
              }}>
                AGENT PERSONALITY
              </label>
              <div style={styles.radioGroup}>
                <div
                  style={styles.radioOption(settings.agentPersonality === 'professional')}
                  onClick={() => setSettings({ ...settings, agentPersonality: 'professional' })}
                >
                  Professional
                </div>
                <div
                  style={styles.radioOption(settings.agentPersonality === 'friendly')}
                  onClick={() => setSettings({ ...settings, agentPersonality: 'friendly' })}
                >
                  Friendly
                </div>
                <div
                  style={styles.radioOption(settings.agentPersonality === 'casual')}
                  onClick={() => setSettings({ ...settings, agentPersonality: 'casual' })}
                >
                  Casual
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Agent Behavior */}
        <div style={styles.section}>
          <Card>
            <h2 style={styles.sectionTitle}>Agent Behavior</h2>
            <p style={styles.sectionDescription}>
              Control what your AI agent can do
            </p>

            <div style={styles.toggleRow}>
              <div>
                <div style={styles.toggleLabel}>Enable Booking</div>
                <div style={styles.toggleDescription}>
                  Allow agent to create tee time bookings
                </div>
              </div>
              <div
                style={styles.toggle(settings.bookingEnabled)}
                onClick={() => setSettings({ ...settings, bookingEnabled: !settings.bookingEnabled })}
              >
                <div style={styles.toggleKnob(settings.bookingEnabled)} />
              </div>
            </div>

            <div style={{ ...styles.formField, marginTop: spacing[4] }}>
              <Input
                label="Max Call Duration (minutes)"
                type="number"
                placeholder="10"
                value={settings.maxCallDuration}
                onChange={(e) => setSettings({ ...settings, maxCallDuration: e.target.value })}
              />
            </div>
          </Card>
        </div>

        <div style={{ height: '80px' }} /> {/* Spacer for fixed save bar */}
      </main>

      {/* Save Bar */}
      <div style={styles.saveBar}>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
