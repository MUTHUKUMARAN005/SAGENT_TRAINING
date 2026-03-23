import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import { CHATBOT_RESPONSES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { getSmartFallbackResponse } from '../../utils/chatbotFallback';

const MAX_HISTORY_MESSAGES = 12;
const FRONTEND_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const FRONTEND_GEMINI_MODEL = String(
  import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
).replace(/^models\//, '');

const normalizeRole = (role) => {
  const value = String(role || '').toLowerCase();
  if (['admin', 'ngo', 'donor', 'volunteer'].includes(value)) return value;
  return 'guest';
};

const buildRolePrompt = (role, isAuthenticated) => {
  const statusLine = isAuthenticated ? 'Authenticated user.' : 'Guest user.';
  const roleLine = `Current role: ${role}.`;
  const scope = {
    admin: 'Admin can manage users, campaigns, reports, and platform insights.',
    ngo: 'NGO can create campaigns, manage volunteers, and track donations.',
    donor: 'Donor can donate, track donations, and download receipts.',
    volunteer: 'Volunteer can view opportunities, tasks, and pickup workflows.',
    guest: 'Guest can browse campaigns and map, and must sign in for role dashboards.',
  };
  return `${statusLine} ${roleLine} ${scope[role] || scope.guest}`;
};

const buildSystemPrompt = (role, isAuthenticated) =>
  [
    'You are KindWave Bot for KindWave donation platform.',
    'Give concise, accurate, platform-focused answers.',
    'Respect role-based access and mention limits clearly when relevant.',
    buildRolePrompt(role, isAuthenticated),
  ].join(' ');

const mapHistoryForGemini = (history, message) => {
  const items = (Array.isArray(history) ? history : [])
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      role: item?.sender === 'bot' ? 'model' : 'user',
      parts: [{ text: String(item?.text || '').trim() }],
    }))
    .filter((item) => item.parts[0].text.length > 0);

  const finalMessage = String(message || '').trim();
  if (finalMessage) {
    items.push({ role: 'user', parts: [{ text: finalMessage }] });
  }

  return items;
};

const extractGeminiAnswer = (data) => {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts)
      ? candidate.content.parts
      : [];
    const text = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();
    if (text) return text;
  }
  return '';
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: CHATBOT_RESPONSES.greeting, sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEnd = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const currentRole = isAuthenticated ? String(user?.role || '').toLowerCase() : 'guest';

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const requestBackendAssistant = async (userText, history) => {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        role: currentRole,
        isAuthenticated,
        history: history.map((item) => ({
          text: item.text,
          sender: item.sender,
        })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const detail = String(data?.detail || data?.error || '').trim();
      throw new Error(detail || 'AI service unavailable');
    }
    return String(data?.answer || '').trim();
  };

  const requestFrontendGemini = async (userText, history) => {
    if (!FRONTEND_GEMINI_KEY) {
      throw new Error('VITE_GEMINI_API_KEY missing');
    }

    const role = normalizeRole(currentRole);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${FRONTEND_GEMINI_MODEL}:generateContent?key=${encodeURIComponent(FRONTEND_GEMINI_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: buildSystemPrompt(role, isAuthenticated) }],
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 450,
          },
          contents: mapHistoryForGemini(history, userText),
        }),
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = String(data?.error?.message || '').trim();
      throw new Error(detail || 'Frontend Gemini request failed');
    }

    const answer = extractGeminiAnswer(data);
    if (!answer) {
      throw new Error('Empty response from Gemini');
    }
    return answer;
  };

  const fetchAssistantReply = async (userText, history) => {
    try {
      const answer = await requestBackendAssistant(userText, history);
      if (answer) return answer;
    } catch {
      // Try frontend Gemini fallback for static builds where /api/chatbot is unavailable.
    }

    return requestFrontendGemini(userText, history);
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: Date.now(), text: trimmed, sender: 'user' };
    const historyWithUser = [...messages, userMsg];

    setMessages(historyWithUser);
    setInput('');
    setIsTyping(true);

    try {
      const aiReply = await fetchAssistantReply(trimmed, historyWithUser);
      const botMsg = {
        id: Date.now() + 1,
        text: aiReply || getSmartFallbackResponse(trimmed, currentRole),
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const botMsg = {
        id: Date.now() + 1,
        text: getSmartFallbackResponse(trimmed, currentRole),
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const quickActionsByRole = {
    admin: ['What can admin do?', 'Campaign insights', 'User access', 'Donation reports'],
    ngo: ['How to manage campaigns?', 'NGO dashboard help', 'Volunteer coordination', 'Track donations'],
    donor: ['How to donate?', 'Get receipt', 'Track my donations', 'Pickup request'],
    volunteer: ['Volunteer opportunities', 'My tasks', 'Pickup workflow', 'Schedule help'],
    guest: ['How to donate?', 'View campaigns', 'Get receipt', 'Volunteer'],
  };
  const quickActions = quickActionsByRole[currentRole] || quickActionsByRole.guest;

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: 'spring' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center 
                   justify-center shadow-glow-lg transition-all duration-300 ${
                     isOpen
                       ? 'bg-red-500 hover:bg-red-600'
                       : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:shadow-glow-lg'
                   }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <FiX className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <FiMessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-primary-500 animate-ping opacity-20" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[500px] glass-card 
                     shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-5 py-4 bg-gradient-to-r from-primary-700 to-blue-700 
                          flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <BsRobot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">KindWave Bot</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-blue-200">Online</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px] 
                          scrollbar-thin scrollbar-thumb-white/10">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-white/10 text-slate-200 rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-bl-md text-sm bg-white/10 text-slate-200">
                    Typing...
                  </div>
                </motion.div>
              )}

              <div ref={messagesEnd} />
            </div>

            {messages.length <= 2 && (
              <div className="px-4 py-2 flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => sendMessage(action)}
                    className="px-3 py-1.5 text-xs rounded-full border border-primary-500/30 
                             text-primary-400 hover:bg-primary-500/10 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                           text-sm text-white placeholder-slate-500 focus:outline-none 
                           focus:border-primary-500 transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 bg-primary-600 rounded-xl text-white hover:bg-primary-500 
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
