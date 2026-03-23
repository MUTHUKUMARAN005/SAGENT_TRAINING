import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cwd } from 'node:process';

const MAX_HISTORY_MESSAGES = 12;

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const sanitizeHistory = (history) =>
  (Array.isArray(history) ? history : [])
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => ({
      text: String(item?.text || '').trim(),
      sender: item?.sender === 'bot' ? 'bot' : 'user',
    }))
    .filter((item) => item.text.length > 0);

const normalizeRole = (role) => {
  const value = String(role || '').toLowerCase();
  if (['admin', 'ngo', 'donor', 'volunteer'].includes(value)) return value;
  return 'guest';
};

const getRolePrompt = (role, isAuthenticated) => {
  const statusLine = isAuthenticated ? 'Authenticated user' : 'Guest user';
  const roleLine = `Current role: ${role}.`;

  const roleScope = {
    admin:
      'Admin scope: platform analytics, user and campaign moderation, fraud alerts, system-level controls.',
    ngo:
      'NGO scope: create/manage campaigns, coordinate volunteers, track donation inflows and campaign progress.',
    donor:
      'Donor scope: browse campaigns, donate, track donation history, and download receipts.',
    volunteer:
      'Volunteer scope: discover opportunities, manage assigned tasks, and coordinate pickup workflows.',
    guest:
      'Guest scope: browse campaigns/map/about pages and must sign in for dashboard or role-restricted actions.',
  };

  return `${statusLine}. ${roleLine} ${roleScope[role] || roleScope.guest}`;
};

const buildSystemPrompt = ({ role, isAuthenticated }) =>
  [
    'You are KindWave Bot, assistant for KindWave donation platform.',
    'Be concise, accurate, and practical.',
    'Answer using only the platform features when possible.',
    'If asked about unavailable actions, clearly say the limitation and suggest the closest supported flow.',
    'For role/access questions, always enforce role boundaries.',
    getRolePrompt(role, isAuthenticated),
  ].join(' ');

const toOpenAIMessages = (history, message) => {
  const items = sanitizeHistory(history).map((item) => ({
    role: item.sender === 'bot' ? 'assistant' : 'user',
    content: [{ type: 'input_text', text: item.text }],
  }));

  const finalUser = String(message || '').trim();
  if (finalUser) {
    items.push({
      role: 'user',
      content: [{ type: 'input_text', text: finalUser }],
    });
  }

  return items;
};

const toGeminiContents = (history, message) => {
  const items = sanitizeHistory(history).map((item) => ({
    role: item.sender === 'bot' ? 'model' : 'user',
    parts: [{ text: item.text }],
  }));

  const finalUser = String(message || '').trim();
  if (finalUser) {
    items.push({
      role: 'user',
      parts: [{ text: finalUser }],
    });
  }

  return items;
};

const extractOpenAIText = (data) => {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputs = Array.isArray(data?.output) ? data.output : [];
  for (const output of outputs) {
    const content = Array.isArray(output?.content) ? output.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string' && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return '';
};

const extractGeminiText = (data) => {
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

const requestOpenAI = async ({
  apiKey,
  model,
  systemPrompt,
  history,
  message,
}) => {
  if (!apiKey) throw new Error('OPENAI_API_KEY is missing.');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      temperature: 0.2,
      max_output_tokens: 450,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }],
        },
        ...toOpenAIMessages(history, message),
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = data?.error?.message || `OpenAI HTTP ${response.status}`;
    throw new Error(reason);
  }

  const answer = extractOpenAIText(data);
  if (!answer) throw new Error('OpenAI returned empty content.');
  return answer;
};

const requestGemini = async ({
  apiKey,
  model,
  systemPrompt,
  history,
  message,
}) => {
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');
  const safeModel = String(model || 'gemini-2.5-flash').replace(/^models\//, '');
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 450,
      },
      contents: toGeminiContents(history, message),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = data?.error?.message || `Gemini HTTP ${response.status}`;
    throw new Error(reason);
  }

  const answer = extractGeminiText(data);
  if (!answer) throw new Error('Gemini returned empty content.');
  return answer;
};

const resolveProvider = (env) => {
  const provider = String(env.AI_PROVIDER || 'auto').toLowerCase();
  if (provider === 'openai' || provider === 'gemini') return provider;
  return 'auto';
};

const createChatbotMiddleware = (env) => {
  const openaiKey = env.OPENAI_API_KEY?.trim();
  const openaiModel = env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const geminiKey = env.GEMINI_API_KEY?.trim();
  const geminiModel = env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const provider = resolveProvider(env);

  return async (req, res, next) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname !== '/api/chatbot') {
      next();
      return;
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const message = String(body?.message || '').trim();
      const history = sanitizeHistory(body?.history);
      const role = normalizeRole(body?.role);
      const isAuthenticated = Boolean(body?.isAuthenticated);

      if (!message) {
        sendJson(res, 400, { error: 'Message is required.' });
        return;
      }

      const systemPrompt = buildSystemPrompt({ role, isAuthenticated });

      let answer = '';
      let selectedProvider = provider;
      const errors = [];

      if (provider === 'openai') {
        answer = await requestOpenAI({
          apiKey: openaiKey,
          model: openaiModel,
          systemPrompt,
          history,
          message,
        });
      } else if (provider === 'gemini') {
        answer = await requestGemini({
          apiKey: geminiKey,
          model: geminiModel,
          systemPrompt,
          history,
          message,
        });
      } else {
        const attempts = [
          {
            providerName: 'gemini',
            enabled: Boolean(geminiKey),
            runner: () =>
              requestGemini({
                apiKey: geminiKey,
                model: geminiModel,
                systemPrompt,
                history,
                message,
              }),
          },
          {
            providerName: 'openai',
            enabled: Boolean(openaiKey),
            runner: () =>
              requestOpenAI({
                apiKey: openaiKey,
                model: openaiModel,
                systemPrompt,
                history,
                message,
              }),
          },
        ];

        for (const attempt of attempts) {
          if (!attempt.enabled) continue;
          try {
            answer = await attempt.runner();
            selectedProvider = attempt.providerName;
            break;
          } catch (error) {
            errors.push(`${attempt.providerName}: ${error.message}`);
          }
        }

        if (!answer) {
          if (!geminiKey && !openaiKey) {
            throw new Error(
              'No AI provider key configured. Set GEMINI_API_KEY or OPENAI_API_KEY.'
            );
          }
          throw new Error(errors.join(' | ') || 'AI provider failed.');
        }
      }

      sendJson(res, 200, { answer, provider: selectedProvider });
    } catch (error) {
      sendJson(res, 503, {
        error: 'AI service unavailable.',
        detail: String(error?.message || 'Unknown error'),
      });
    }
  };
};

const chatbotApiPlugin = (env) => ({
  name: 'kindwave-chatbot-api',
  configureServer(server) {
    server.middlewares.use(createChatbotMiddleware(env));
  },
  configurePreviewServer(server) {
    server.middlewares.use(createChatbotMiddleware(env));
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '');

  return {
    plugins: [react(), chatbotApiPlugin(env)],
    server: {
      host: true,
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
  };
});
