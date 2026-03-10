import React, { useEffect, useRef, useState } from 'react';
import { FiMessageCircle, FiSend, FiTrash2, FiX, FiZap } from 'react-icons/fi';
import { askGemini, isGeminiConfigured, setGeminiApiKey } from '../../api/gemini';
import './AIAssistant.css';

const STORAGE_KEY = 'freshmart_ai_assistant_messages_v1';
const MAX_HISTORY_ITEMS = 16;
const WELCOME_MESSAGE_CONTENT =
  'Hi! I am your AI assistant. Ask me anything about products, orders, or general questions.';

const createMessage = (role, content) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
});

const getWelcomeMessage = () =>
  createMessage(
    'assistant',
    WELCOME_MESSAGE_CONTENT
  );

const sanitizeStoredMessages = (value) => {
  if (!Array.isArray(value)) return null;

  const normalized = value
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      id: item.id || `${item.role}-${Math.random().toString(36).slice(2, 8)}`,
      role: item.role,
      content: item.content,
      createdAt: item.createdAt || new Date().toISOString(),
    }));

  return normalized.length ? normalized : null;
};

const getInitialMessages = () => {
  if (typeof window === 'undefined') return [getWelcomeMessage()];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return sanitizeStoredMessages(parsed) || [getWelcomeMessage()];
  } catch {
    return [getWelcomeMessage()];
  }
};

const formatHistoryForGemini = (messages) => {
  const normalized = messages
    .filter((message) => message?.role === 'user' || message?.role === 'assistant')
    .filter((message) => message.content !== WELCOME_MESSAGE_CONTENT)
    .slice(-10)
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      text: message.content,
    }));

  // Gemini requests are more reliable when the conversation starts with a user turn.
  while (normalized.length && normalized[0].role !== 'user') {
    normalized.shift();
  }

  return normalized;
};

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(getInitialMessages);
  const [inputValue, setInputValue] = useState('');
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const messageEndRef = useRef(null);
  const textareaRef = useRef(null);
  const configured = isGeminiConfigured();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_HISTORY_ITEMS)));
  }, [messages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    const prompt = inputValue.trim();
    if (!prompt || isLoading) return;

    const nextUserMessage = createMessage('user', prompt);
    const history = formatHistoryForGemini(messages);

    setMessages((prev) => [...prev, nextUserMessage]);
    setInputValue('');
    setErrorText('');
    setIsLoading(true);

    try {
      const reply = await askGemini(prompt, history);
      setMessages((prev) => [...prev, createMessage('assistant', reply)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get AI response.';
      setErrorText(message);
      setMessages((prev) => [
        ...prev,
        createMessage(
          'assistant',
          `Sorry, I could not answer right now. ${message}`
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([getWelcomeMessage()]);
    setErrorText('');
  };

  const saveRuntimeKey = () => {
    const key = apiKeyDraft.trim();
    if (!key) {
      setErrorText('Enter a Gemini API key first.');
      return;
    }

    setGeminiApiKey(key);
    setApiKeyDraft('');
    setErrorText('');
  };

  return (
    <div className="ai-assistant-root">
      {isOpen && (
        <section
          className="ai-assistant-panel"
          aria-label="AI assistant chat"
          role="dialog"
          aria-modal="false"
        >
          <header className="ai-assistant-header">
            <div className="ai-assistant-title">
              <span className="ai-assistant-title-icon" aria-hidden="true">
                <FiZap />
              </span>
              <div>
                <h3>AI Assistant</h3>
                <p>{configured ? 'Gemini connected' : 'Gemini API key required'}</p>
              </div>
            </div>
            <div className="ai-assistant-actions">
              <button type="button" onClick={clearChat} aria-label="Clear chat">
                <FiTrash2 />
              </button>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant">
                <FiX />
              </button>
            </div>
          </header>

          {!configured && (
            <div className="ai-assistant-banner" role="status">
              <p>
                Add <code>REACT_APP_GEMINI_API_KEY</code> in <code>.env</code> and restart the app,
                or paste the key below to use it now.
              </p>
              <div className="ai-assistant-key-row">
                <input
                  type="password"
                  value={apiKeyDraft}
                  onChange={(event) => setApiKeyDraft(event.target.value)}
                  placeholder="Paste Gemini API key"
                  autoComplete="off"
                />
                <button type="button" onClick={saveRuntimeKey}>
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="ai-assistant-messages">
            {messages.map((message) => (
              <div key={message.id} className={`ai-message ai-message-${message.role}`}>
                <div className="ai-message-bubble">{message.content}</div>
              </div>
            ))}

            {isLoading && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-message-bubble ai-message-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messageEndRef} />
          </div>

          <div className="ai-assistant-composer">
            <label htmlFor="ai-assistant-input" className="sr-only">
              Ask AI assistant
            </label>
            <textarea
              id="ai-assistant-input"
              ref={textareaRef}
              rows={2}
              placeholder="Ask anything..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !configured}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim() || !configured}
              aria-label="Send message"
            >
              <FiSend />
            </button>
          </div>

          {errorText && (
            <p className="ai-assistant-error" role="alert">
              {errorText}
            </p>
          )}
        </section>
      )}

      <button
        type="button"
        className="ai-assistant-launcher"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
}

export default AIAssistant;
