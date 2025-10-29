/**
 * Chat Widget Component
 * Conversational UI for demo interactions
 */

import React, { useState, useRef, useEffect } from 'react';
import { chatAPI, type ChatRequest } from '../lib/api';
import { colors, borderRadius, shadows, spacing } from '../lib/design-system';
import { Button, Input } from './ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  demoSlug?: string;
  golfCourseId?: string;
  initialMessage?: string;
  onInteractionCountChange?: (count: number, limit: number) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  demoSlug,
  golfCourseId,
  initialMessage = "Hi! How can I help you today?",
  onInteractionCountChange,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const request: ChatRequest = {
        message: inputValue,
        session_id: sessionId,
        context: {
          ...(demoSlug && { demo_slug: demoSlug }),
          ...(golfCourseId && { golf_course_id: golfCourseId }),
        },
      };

      const response = await chatAPI.sendMessage(request);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.interaction_count !== undefined && response.interaction_limit !== undefined) {
        onInteractionCountChange?.(response.interaction_count, response.interaction_limit);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '600px',
      background: colors.bg.primary,
      border: `1px solid ${colors.border.base}`,
      borderRadius: borderRadius.large,
      boxShadow: shadows.medium,
      overflow: 'hidden',
    },

    header: {
      padding: spacing[4],
      background: colors.bg.secondary,
      borderBottom: `1px solid ${colors.border.base}`,
    },

    headerTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: colors.text.primary,
      margin: 0,
    },

    headerSubtitle: {
      fontSize: '12px',
      color: colors.text.tertiary,
      margin: 0,
      marginTop: spacing[1],
    },

    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: spacing[4],
      display: 'flex',
      flexDirection: 'column' as const,
      gap: spacing[3],
    },

    message: {
      display: 'flex',
      gap: spacing[3],
      alignItems: 'flex-start',
    },

    messageContent: {
      padding: spacing[3],
      borderRadius: borderRadius.base,
      maxWidth: '80%',
      fontSize: '14px',
      lineHeight: 1.5,
    },

    userMessage: {
      background: colors.accent.blue,
      color: '#FFFFFF',
      marginLeft: 'auto',
    },

    assistantMessage: {
      background: colors.bg.tertiary,
      color: colors.text.primary,
    },

    timestamp: {
      fontSize: '11px',
      color: colors.text.tertiary,
      marginTop: spacing[1],
    },

    inputContainer: {
      padding: spacing[4],
      background: colors.bg.primary,
      borderTop: `1px solid ${colors.border.base}`,
      display: 'flex',
      gap: spacing[2],
    },

    input: {
      flex: 1,
    },

    loadingDots: {
      display: 'flex',
      gap: '4px',
      padding: spacing[3],
    },

    dot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: colors.text.tertiary,
      animation: 'pulse 1.4s infinite ease-in-out',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>ProShop 24/7</h3>
        <p style={styles.headerSubtitle}>
          {demoSlug ? 'Custom Demo' : 'Fox Hollow Golf Course'}
        </p>
      </div>

      <div style={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div>
              <div
                style={{
                  ...styles.messageContent,
                  ...(message.role === 'user' ? styles.userMessage : styles.assistantMessage),
                }}
              >
                {message.content}
              </div>
              <div style={{ ...styles.timestamp, textAlign: message.role === 'user' ? 'right' : 'left' }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={styles.loadingDots}>
            <div style={styles.dot} />
            <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
            <div style={{ ...styles.dot, animationDelay: '0.4s' }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputContainer}>
        <Input
          style={styles.input}
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
          Send
        </Button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          30% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;
