/**
 * Chat Widget Component - White Theme
 * Linear-inspired minimal design
 */

import React, { useState, useRef, useEffect } from 'react';
import { chatAPI, type ChatRequest } from '../lib/api';
import { whiteTheme } from '../lib/white-theme';

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
      height: '100%',
      minHeight: '500px',
      maxHeight: '700px',
      background: whiteTheme.bg.primary,
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '12px',
      boxShadow: whiteTheme.shadow.xl,
      overflow: 'hidden',
    },

    header: {
      padding: '16px 20px',
      background: whiteTheme.bg.primary,
      borderBottom: `1px solid ${whiteTheme.border.light}`,
    },

    headerTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: whiteTheme.text.primary,
      margin: 0,
    },

    headerSubtitle: {
      fontSize: '12px',
      color: whiteTheme.text.tertiary,
      margin: 0,
      marginTop: '4px',
    },

    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      background: whiteTheme.bg.secondary,
    },

    messageWrapper: (isUser: boolean) => ({
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }),

    messageBubble: (isUser: boolean) => ({
      maxWidth: '75%',
      padding: '10px 14px',
      borderRadius: '12px',
      fontSize: '14px',
      lineHeight: 1.5,
      background: isUser ? whiteTheme.accent.blue : whiteTheme.bg.primary,
      color: isUser ? '#FFFFFF' : whiteTheme.text.primary,
      border: isUser ? 'none' : `1px solid ${whiteTheme.border.light}`,
      boxShadow: whiteTheme.shadow.small,
    }),

    timestamp: {
      fontSize: '11px',
      color: whiteTheme.text.tertiary,
      marginTop: '4px',
      textAlign: 'right' as const,
    },

    inputContainer: {
      padding: '16px 20px',
      background: whiteTheme.bg.primary,
      borderTop: `1px solid ${whiteTheme.border.light}`,
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end',
    },

    input: {
      flex: 1,
      padding: '10px 12px',
      border: `1px solid ${whiteTheme.border.base}`,
      borderRadius: '8px',
      fontSize: '14px',
      color: whiteTheme.text.primary,
      background: whiteTheme.bg.primary,
      outline: 'none',
      resize: 'none' as const,
      fontFamily: 'Inter, sans-serif',
      minHeight: '40px',
      maxHeight: '120px',
    },

    sendButton: {
      padding: '10px 20px',
      background: whiteTheme.accent.blue,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minHeight: '40px',
    },

    loadingContainer: {
      display: 'flex',
      justifyContent: 'flex-start',
    },

    loadingBubble: {
      maxWidth: '75%',
      padding: '10px 14px',
      borderRadius: '12px',
      background: whiteTheme.bg.primary,
      border: `1px solid ${whiteTheme.border.light}`,
      boxShadow: whiteTheme.shadow.small,
    },

    loadingDots: {
      display: 'flex',
      gap: '4px',
    },

    dot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: whiteTheme.text.tertiary,
      animation: 'pulse 1.4s infinite ease-in-out',
    },
  };

  return (
    <>
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

        .chat-input:focus {
          border-color: ${whiteTheme.accent.blue};
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
        }

        .send-button:hover:not(:disabled) {
          background: ${whiteTheme.accent.blueHover};
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: ${whiteTheme.bg.secondary};
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: ${whiteTheme.border.medium};
          border-radius: 3px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: ${whiteTheme.border.dark};
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>ProShop 24/7</h3>
          <p style={styles.headerSubtitle}>
            {demoSlug ? `${demoSlug} demo` : 'AI Golf Assistant'}
          </p>
        </div>

        <div className="messages-container" style={styles.messagesContainer}>
          {messages.map((message, index) => (
            <div key={index} style={styles.messageWrapper(message.role === 'user')}>
              <div>
                <div style={styles.messageBubble(message.role === 'user')}>
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div style={styles.timestamp}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingBubble}>
                <div style={styles.loadingDots}>
                  <div style={styles.dot} />
                  <div style={{ ...styles.dot, animationDelay: '0.2s' }} />
                  <div style={{ ...styles.dot, animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainer}>
          <textarea
            className="chat-input"
            style={styles.input}
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            rows={1}
          />
          <button
            className="send-button"
            style={styles.sendButton}
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
