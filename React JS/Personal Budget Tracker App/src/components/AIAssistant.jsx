import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { aiAssistantAPI, dashboardAPI } from '../api/axiosConfig';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const fmtCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const createMessage = (role, text) => ({
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text
});

const getTopExpenseLines = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return 'No category expense data is available yet.';
    const top = [...items]
        .map((item) => ({
            category: item.category || item.name || 'Category',
            total: Number(item.total || item.amount || 0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

    return top
        .map((item, index) => `${index + 1}. ${item.category}: ${fmtCurrency(item.total)}`)
        .join('\n');
};

const buildDashboardSummary = (dashboard) => {
    if (!dashboard) return 'I could not load your dashboard data right now.';
    return [
        `Balance: ${fmtCurrency(dashboard.totalBalance)}`,
        `Income: ${fmtCurrency(dashboard.totalIncome)}`,
        `Expenses: ${fmtCurrency(dashboard.totalExpense)}`,
        `Savings: ${fmtCurrency(dashboard.savings)}`,
        `Accounts: ${dashboard.accountCount || 0}`,
        `Active Goals: ${dashboard.activeGoals || 0}`,
        `Unread Alerts: ${dashboard.unreadAlerts || 0}`
    ].join('\n');
};

const extractAssistantText = (payload) => {
    if (!payload) return '';
    if (typeof payload === 'string') return payload;

    const candidates = [
        payload.answer,
        payload.message,
        payload.response,
        payload.content,
        payload.data?.answer,
        payload.data?.message
    ];

    for (const candidate of candidates) {
        if (typeof candidate === 'string') return candidate;
        if (candidate && typeof candidate === 'object') {
            if (typeof candidate.text === 'string') return candidate.text;
            if (typeof candidate.content === 'string') return candidate.content;
        }
    }

    return '';
};

const extractGeminiText = (payload) => {
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
    for (const candidate of candidates) {
        const parts = candidate?.content?.parts;
        if (!Array.isArray(parts)) continue;
        const text = parts
            .map((part) => (typeof part?.text === 'string' ? part.text : ''))
            .filter(Boolean)
            .join('\n')
            .trim();
        if (text) return text;
    }
    return '';
};

const buildGeminiPrompt = ({ question, dashboard, userName, messages }) => {
    const recent = (messages || [])
        .slice(-6)
        .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${String(m.text || '')}`)
        .join('\n');

    return [
        'You are an AI assistant inside a Personal Budget Tracker web app.',
        'Answer budget/app questions clearly and concisely.',
        'If the user asks general knowledge, answer normally.',
        'If dashboard data is provided, use it.',
        userName ? `Current user: ${userName}` : '',
        dashboard ? `Dashboard data:\n${buildDashboardSummary(dashboard)}\nTop categories:\n${getTopExpenseLines(dashboard.expenseByCategory)}` : '',
        recent ? `Recent chat:\n${recent}` : '',
        `User question: ${question}`
    ]
        .filter(Boolean)
        .join('\n\n');
};

const askGemini = async ({ question, dashboard, userName, messages }) => {
    if (!GEMINI_API_KEY) return '';

    const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: buildGeminiPrompt({ question, dashboard, userName, messages }) }]
                }
            ],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 500
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Gemini request failed (${response.status}) ${errorText}`.trim());
    }

    const payload = await response.json();
    return extractGeminiText(payload);
};

const localAssistantAnswer = ({ question, dashboard, userName }) => {
    const q = (question || '').toLowerCase().trim();
    const name = userName || 'there';

    if (!q) return 'Please type a question.';
    if (/(hi|hello|hey)\b/.test(q)) {
        return `Hi ${name}. Ask me about your balance, income, expenses, savings, alerts, or how to use any page in this app.`;
    }
    if (/(summary|dashboard|status|overview)/.test(q)) {
        return `Here is your current dashboard summary:\n${buildDashboardSummary(dashboard)}`;
    }
    if (/\bbalance\b/.test(q)) {
        return dashboard
            ? `Your current total balance is ${fmtCurrency(dashboard.totalBalance)}.`
            : 'I could not load your balance right now.';
    }
    if (/\bincome\b/.test(q)) {
        return dashboard
            ? `Your total income is ${fmtCurrency(dashboard.totalIncome)}.`
            : 'I could not load income data right now.';
    }
    if (/\b(expense|expenses|spend|spending)\b/.test(q) && /\b(category|categories|top)\b/.test(q)) {
        return dashboard
            ? `Top expense categories:\n${getTopExpenseLines(dashboard.expenseByCategory)}`
            : 'I could not load category spending data right now.';
    }
    if (/\b(expense|expenses|spend|spending)\b/.test(q)) {
        return dashboard
            ? `Your total expenses are ${fmtCurrency(dashboard.totalExpense)}.`
            : 'I could not load expense data right now.';
    }
    if (/\b(savings|saving|net)\b/.test(q)) {
        return dashboard
            ? `Your net savings are ${fmtCurrency(dashboard.savings)}.`
            : 'I could not load savings data right now.';
    }
    if (/\balert|notification/.test(q)) {
        return dashboard
            ? `You currently have ${dashboard.unreadAlerts || 0} unread alerts. Open the Alerts page to review or mark them as read.`
            : 'Open the Alerts page from the sidebar to review notifications.';
    }
    if (/\b(account|accounts)\b/.test(q)) {
        if (/\bhow\b|\badd\b|\bcreate\b/.test(q)) {
            return 'Open Accounts from the sidebar, click Add, enter account details and balance, then save.';
        }
        return dashboard
            ? `You currently have ${dashboard.accountCount || 0} accounts.`
            : 'Open Accounts from the sidebar to view and manage your accounts.';
    }
    if (/\bbudget|budgets\b/.test(q)) {
        return 'Use the Budgets page to create monthly category limits and track usage. Ask me for a dashboard summary if you want a quick spending overview.';
    }
    if (/\bgoal|goals\b/.test(q)) {
        if (dashboard) {
            return `You currently have ${dashboard.activeGoals || 0} active goals. Open Goals to add new goals or contribute to existing ones.`;
        }
        return 'Use the Goals page to set savings targets, track progress, and add contributions.';
    }
    if (/\btransfer|transfers\b/.test(q)) {
        return 'Use Transfers to move money between your accounts and keep balances updated.';
    }
    if (/\brecurring|repeat|scheduled\b/.test(q)) {
        return 'Use Recurring Transactions to automate repeat income or expense entries.';
    }
    if (/\b(report|reports)\b/.test(q)) {
        return 'Open Reports to generate and review financial reports for your account activity.';
    }
    if (/\b(category|categories)\b/.test(q)) {
        return 'Use Categories to create and manage custom income and expense categories.';
    }
    if (/\bhow\b/.test(q) && /\b(add|create|record)\b/.test(q) && /\bexpense\b/.test(q)) {
        return 'Open Expenses, click Add Expense, select account and category, enter amount/date/notes, then save.';
    }
    if (/\bhow\b/.test(q) && /\b(add|create|record)\b/.test(q) && /\bincome\b/.test(q)) {
        return 'Open Income, click Add Income, choose account and category, enter amount/date, then save.';
    }

    return [
        'I can answer questions about your budget tracker and current dashboard numbers.',
        'Try: "dashboard summary", "what is my balance?", "top expense categories", or "how do I add an expense?"'
    ].join('\n');
};

const AIAssistant = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState(() => [
        createMessage(
            'assistant',
            'AI Assistant is ready. Ask about your dashboard, spending, savings, or how to use this app.'
        )
    ]);
    const [dashboard, setDashboard] = useState(null);
    const messagesRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !messagesRef.current) return;
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }, [messages, isOpen]);

    useEffect(() => {
        let ignore = false;

        const loadDashboard = async () => {
            if (!userId) {
                setDashboard(null);
                return;
            }
            try {
                const res = await dashboardAPI.get(userId);
                if (!ignore) setDashboard(res.data);
            } catch (error) {
                if (!ignore) setDashboard(null);
                console.error('Assistant dashboard context load failed', error);
            }
        };

        loadDashboard();
        return () => {
            ignore = true;
        };
    }, [userId]);

    if (!currentUser) return null;

    const sendQuestion = async () => {
        const question = input.trim();
        if (!question || isLoading) return;

        const userMessage = createMessage('user', question);
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        let answerText = '';
        let latestDashboard = dashboard;
        const historySnapshot = [...messages, userMessage];
        try {
            if (userId) {
                try {
                    const freshDashboard = await dashboardAPI.get(userId);
                    latestDashboard = freshDashboard.data;
                    setDashboard(freshDashboard.data);
                } catch (error) {
                    console.warn('Using cached dashboard context for assistant.', error);
                }
            }

            const res = await aiAssistantAPI.ask({
                question,
                userId,
                context: latestDashboard
                    ? {
                        dashboardSummary: {
                            totalBalance: latestDashboard.totalBalance,
                            totalIncome: latestDashboard.totalIncome,
                            totalExpense: latestDashboard.totalExpense,
                            savings: latestDashboard.savings,
                            accountCount: latestDashboard.accountCount,
                            activeGoals: latestDashboard.activeGoals,
                            unreadAlerts: latestDashboard.unreadAlerts,
                            expenseByCategory: latestDashboard.expenseByCategory
                        }
                    }
                    : null
            });
            answerText = extractAssistantText(res.data);
        } catch (error) {
            console.warn('AI endpoint unavailable, using local assistant fallback.', error);
        }

        try {
            if (!answerText) {
                try {
                    answerText = await askGemini({
                        question,
                        dashboard: latestDashboard,
                        userName: currentUser?.name,
                        messages: historySnapshot
                    });
                } catch (error) {
                    console.warn('Gemini request failed, using local assistant fallback.', error);
                }
            }

            if (!answerText) {
                answerText = localAssistantAnswer({
                    question,
                    dashboard: latestDashboard,
                    userName: currentUser?.name
                });
            }

            setMessages((prev) => [...prev, createMessage('assistant', String(answerText || ''))]);
        } catch (error) {
            console.error('Assistant failed to generate a response.', error);
            setMessages((prev) => [
                ...prev,
                createMessage('assistant', 'Sorry, something went wrong while generating the answer.')
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickPrompts = [
        'Dashboard summary',
        'What is my balance?',
        'Top expense categories',
        'How do I add an expense?'
    ];

    return (
        <div className="ai-assistant-shell" aria-live="polite">
            {isOpen && (
                <section id="ai-assistant-panel" className="ai-assistant-panel" aria-label="AI Assistant">
                    <header className="ai-assistant-header">
                        <div>
                            <strong>AI Assistant</strong>
                            <p>Ask about your finances and app actions</p>
                        </div>
                        <button
                            type="button"
                            className="ai-assistant-icon-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close assistant"
                        >
                            x
                        </button>
                    </header>

                    <div className="ai-assistant-messages" ref={messagesRef}>
                        {messages.map((message) => (
                            <div key={message.id} className={`ai-msg ai-msg-${message.role}`}>
                                <div className="ai-msg-bubble">
                                    {message.text.split('\n').map((line, index) => (
                                        <React.Fragment key={`${message.id}-${index}`}>
                                            {index > 0 && <br />}
                                            {line}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="ai-msg ai-msg-assistant">
                                <div className="ai-msg-bubble ai-msg-typing">Thinking...</div>
                            </div>
                        )}
                    </div>

                    <div className="ai-assistant-prompts">
                        {quickPrompts.map((prompt) => (
                            <button
                                type="button"
                                key={prompt}
                                className="ai-prompt-chip"
                                onClick={() => setInput(prompt)}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    <div className="ai-assistant-input">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            rows={2}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendQuestion();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={sendQuestion}
                            disabled={isLoading || !input.trim()}
                        >
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </section>
            )}

            <button
                type="button"
                className="ai-assistant-launcher"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-controls="ai-assistant-panel"
            >
                <span className="ai-assistant-launcher-label">{isOpen ? 'Close Assistant' : 'Ask AI'}</span>
            </button>
        </div>
    );
};

export default AIAssistant;
