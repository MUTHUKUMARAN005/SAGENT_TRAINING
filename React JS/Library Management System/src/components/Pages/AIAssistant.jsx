import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import PageTransition from '../Common/PageTransition';
import { askAssistant, isGeminiQuotaError } from '../../api/gemini';

const QUICK_PROMPTS = [
  'How can I renew a borrowed book and avoid fines?',
  'Suggest 5 books for a beginner in personal finance.',
  'Help me write a polite overdue reminder message.',
  'Explain a topic in simple language for a student.'
];

const hasFrontendGeminiKey = () => Boolean(process.env.REACT_APP_GEMINI_API_KEY);
const looksLikeQuotaError = (err) =>
  (typeof isGeminiQuotaError === 'function' && isGeminiQuotaError(err)) ||
  /quota exceeded|resource exhausted|rate limit/i.test(err?.message || '');

const bubbleStyle = (role) => ({
  maxWidth: 'min(780px, 88%)',
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  background:
    role === 'user'
      ? 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(16,185,129,0.16))'
      : 'rgba(15,23,42,0.62)',
  border:
    role === 'user'
      ? '1px solid rgba(34,197,94,0.35)'
      : '1px solid rgba(148,163,184,0.14)',
  color: '#e2e8f0',
  borderRadius: '16px',
  padding: '12px 14px',
  whiteSpace: 'pre-wrap',
  lineHeight: 1.45,
  fontSize: '13px',
  boxShadow:
    role === 'user'
      ? '0 10px 24px -16px rgba(34,197,94,0.45)'
      : '0 10px 24px -18px rgba(0,0,0,0.55)'
});

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}, I can help with member queries (borrowing, renewals, fines, requests, notifications) and general questions. What would you like to ask?`
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const listEndRef = useRef(null);

  const configured = hasFrontendGeminiKey();
  const canSend = input.trim() && !sending;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, sending]);

  const helperText = useMemo(() => {
    if (configured) return 'Gemini is configured. Ask member queries or general questions.';
    return 'Gemini API key is missing. Add REACT_APP_GEMINI_API_KEY to .env and restart the app.';
  }, [configured]);

  const sendMessage = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || sending) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: prompt
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError('');
    setStatusNotice('');
    setSending(true);

    try {
      const nextConversation = [...messages, userMessage];
      const result = await askAssistant(nextConversation);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: result.text,
          source: result.source
        }
      ]);
      if (result.warning) setStatusNotice(result.warning);
    } catch (err) {
      if (looksLikeQuotaError(err)) {
        setError(
          `Gemini quota/rate limit reached temporarily. ${err?.message ? `Details: ${err.message}` : ''}`.trim()
        );
      } else {
        setError(err?.message || 'Failed to get a response from Gemini.');
      }
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (canSend) sendMessage();
  };

  return (
    <PageTransition>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: '16px',
          borderRadius: '18px',
          padding: '22px 24px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(15,23,42,0.35))',
          border: '1px solid rgba(34,197,94,0.16)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 'auto -40px -40px auto',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(34,197,94,0.18), transparent 70%)',
            borderRadius: '50%'
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 800,
                color: '#f0fdf4',
                boxShadow: '0 10px 22px -12px rgba(34,197,94,0.55)'
              }}
            >
              AI
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: 800 }}>
                AI Assistant
              </h2>
              <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                {helperText}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {!configured && (
        <div
          style={{
            marginBottom: '14px',
            borderRadius: '12px',
            padding: '10px 12px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.18)',
            color: '#fcd34d',
            fontSize: '12px'
          }}
        >
          Add `REACT_APP_GEMINI_API_KEY` in `.env`, then restart `npm start`.
        </div>
      )}

      {statusNotice && (
        <div
          style={{
            marginBottom: '14px',
            borderRadius: '12px',
            padding: '10px 12px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.16)',
            color: '#bbf7d0',
            fontSize: '12px'
          }}
        >
          {statusNotice}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '14px'
        }}
      >
        <div
          style={{
            borderRadius: '18px',
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(2,6,23,0.45)',
            backdropFilter: 'blur(10px)',
            minHeight: '420px',
            maxHeight: '58vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px'
          }}
        >
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.12) }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  color: message.role === 'user' ? '#86efac' : '#cbd5e1',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                {message.role === 'user'
                  ? 'You'
                  : message.source === 'fallback'
                    ? 'Assistant (Fallback)'
                    : 'Assistant'}
              </div>
              <div style={bubbleStyle(message.role)}>{message.content}</div>
            </motion.div>
          ))}

          {sending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div
                style={{
                  color: '#cbd5e1',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                Assistant
              </div>
              <div style={bubbleStyle('assistant')}>
                <span style={{ color: '#94a3b8' }}>Thinking...</span>
              </div>
            </motion.div>
          )}

          <div ref={listEndRef} />
        </div>

        <div
          style={{
            borderRadius: '16px',
            border: '1px solid rgba(148,163,184,0.14)',
            background: 'rgba(15,23,42,0.42)',
            padding: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={sending}
                style={{
                  borderRadius: '999px',
                  padding: '7px 10px',
                  border: '1px solid rgba(148,163,184,0.16)',
                  background: 'rgba(30,41,59,0.55)',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.6 : 1
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) sendMessage();
                }
              }}
              placeholder="Ask about borrowing, renewals, fines, books, or any general question..."
              rows={4}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: '92px',
                borderRadius: '12px',
                border: '1px solid rgba(148,163,184,0.18)',
                background: 'rgba(2,6,23,0.65)',
                color: '#f1f5f9',
                padding: '12px',
                fontSize: '13px',
                lineHeight: 1.4,
                outline: 'none'
              }}
            />

            {error && (
              <div
                style={{
                  marginTop: '10px',
                  borderRadius: '10px',
                  padding: '9px 10px',
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.18)',
                  color: '#fca5a5',
                  fontSize: '12px'
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMessages((prev) => prev.slice(0, 1));
                  setError('');
                }}
                disabled={sending || messages.length <= 1}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: 'rgba(30,41,59,0.55)',
                  color: '#cbd5e1',
                  cursor: sending || messages.length <= 1 ? 'not-allowed' : 'pointer',
                  opacity: sending || messages.length <= 1 ? 0.6 : 1,
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Clear Chat
              </button>

              <button
                type="submit"
                disabled={!canSend}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(34,197,94,0.28)',
                  background: canSend
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.20), rgba(20,184,166,0.18))'
                    : 'rgba(30,41,59,0.55)',
                  color: canSend ? '#dcfce7' : '#94a3b8',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};

export default AIAssistant;
