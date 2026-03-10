import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiSend, FiZap } from 'react-icons/fi';
import { toast } from 'react-toastify';
import PageTransition from '../components/PageTransition';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchAdmissionsSnapshot, generateAIResponse } from '../api/aiService';
import { useAuth } from '../context/AuthContext';
import { isStudentRoleUser } from '../utils/ownership';

const quickPrompts = [
  'Summarize today\'s admissions funnel and list three priorities.',
  'Draft a polite follow-up email for students with pending applications.',
  'Identify bottlenecks in approval workflow and suggest fixes.',
  'Create a weekly action plan to improve application completion rate.',
];

const getSourceLabel = (source) => {
  if (source === 'openai') return 'OpenAI';
  if (source === 'gemini') return 'Gemini';
  if (source === 'proxy') return 'AI Proxy';
  return 'Local Summary';
};

const AIAssistant = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [responseText, setResponseText] = useState('');
  const [responseSource, setResponseSource] = useState('fallback');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingSnapshot, setLoadingSnapshot] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const isStudentUser = isStudentRoleUser(user);

  const hasSnapshot = useMemo(() => !!snapshot, [snapshot]);

  const loadSnapshot = useCallback(async () => {
    setLoadingSnapshot(true);
    try {
      const data = await fetchAdmissionsSnapshot(user);
      setSnapshot(data);
    } catch (error) {
      console.error('Failed to load snapshot:', error);
      toast.error('Could not load admissions context. AI output may be limited.');
    } finally {
      setLoadingSnapshot(false);
    }
  }, [user]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const runAI = async (promptValue) => {
    const text = (promptValue || '').trim();
    if (!text) {
      toast.warning('Enter a prompt first.');
      return;
    }

    setLoadingAI(true);
    try {
      const result = await generateAIResponse({
        prompt: text,
        snapshot,
      });
      setResponseText(result.text || 'No response text returned.');
      setResponseSource(result.source);
      if (result.source === 'fallback') {
        if (result.fallbackReason === 'provider_failed') {
          const firstProviderError = result.providerErrors?.[0];
          toast.warning(
            firstProviderError
              ? `AI provider failed (${firstProviderError}). Showing local summary instead.`
              : 'AI provider request failed. Showing local summary instead.'
          );
        } else {
          toast.info('Using local AI summary. Configure API keys or proxy for full AI.');
        }
      }
    } catch (error) {
      const message = error?.message || 'Failed to generate AI response.';
      toast.error(message);
    } finally {
      setLoadingAI(false);
    }
  };

  if (loadingSnapshot) return <LoadingSpinner />;

  return (
    <PageTransition>
      <div className="page-header">
        <motion.div
          className="page-header-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1>AI Assistant</h1>
          <p>
            {isStudentUser
              ? 'Generate insights and summaries from your own admission data.'
              : 'Generate operational insights, drafts, and recommendations.'}
          </p>
        </motion.div>

        <motion.button
          className="btn btn-secondary"
          onClick={loadSnapshot}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          disabled={loadingSnapshot}
        >
          <FiRefreshCw />
          Refresh Context
        </motion.button>
      </div>

      {hasSnapshot && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <motion.div className="stat-card gradient-1" whileHover={{ y: -4 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Students</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{snapshot.counts.students}</div>
          </motion.div>
          <motion.div className="stat-card gradient-2" whileHover={{ y: -4 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Applications</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{snapshot.counts.applications}</div>
          </motion.div>
          <motion.div className="stat-card gradient-3" whileHover={{ y: -4 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Courses</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{snapshot.counts.courses}</div>
          </motion.div>
          <motion.div className="stat-card gradient-4" whileHover={{ y: -4 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Payments</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{snapshot.counts.payments}</div>
          </motion.div>
        </div>
      )}

      <div className="table-container" style={{ marginBottom: 24 }}>
        <div className="table-header">
          <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiZap color="var(--accent-light)" />
            AI Prompt
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div className="form-group">
            <label className="form-label">What should AI help with?</label>
            <textarea
              className="form-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Example: Analyze pending applications and suggest next steps for officers."
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {quickPrompts.map((item) => (
              <button
                key={item}
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setPrompt(item);
                  runAI(item);
                }}
                disabled={loadingAI}
              >
                {item}
              </button>
            ))}
          </div>

          <motion.button
            className="btn btn-primary"
            onClick={() => runAI(prompt)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            disabled={loadingAI}
          >
            <FiSend />
            {loadingAI ? 'Generating...' : 'Generate Insight'}
          </motion.button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-title">AI Response</div>
          <span className="status-badge under-review">
            <span className="status-dot" />
            {getSourceLabel(responseSource)}
          </span>
        </div>
        <div style={{ padding: 20 }}>
          {responseText ? (
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text-secondary)',
                fontFamily: 'inherit',
                lineHeight: 1.65,
              }}
            >
              {responseText}
            </pre>
          ) : (
            <div className="empty-state" style={{ padding: 24 }}>
              <h3>No AI output yet</h3>
              <p>Submit a prompt or use one of the quick actions.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default AIAssistant;
