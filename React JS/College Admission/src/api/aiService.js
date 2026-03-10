import API from './axiosConfig';
import { filterRecordsForUser, filterStudentsForUser } from '../utils/ownership';

const AI_PROXY_URL = process.env.REACT_APP_AI_PROXY_URL;
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.REACT_APP_GEMINI_MODEL || 'gemini-flash-latest';
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_MODEL = process.env.REACT_APP_OPENAI_MODEL || 'gpt-4o-mini';
const AI_REQUEST_TIMEOUT_MS = Number(process.env.REACT_APP_AI_TIMEOUT_MS || 20000);

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const parseTextBlocks = (value) => {
  if (!Array.isArray(value)) return '';

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item?.text === 'string') return item.text;
      if (typeof item?.output_text === 'string') return item.output_text;
      if (typeof item?.content === 'string') return item.content;
      if (Array.isArray(item?.content)) return parseTextBlocks(item.content);
      return '';
    })
    .join('')
    .trim();
};

const parseAIResponse = (payload) => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (payload?.data) {
    const nested = parseAIResponse(payload.data);
    if (nested) return nested;
  }

  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.reply === 'string') return payload.reply;
  if (typeof payload.answer === 'string') return payload.answer;
  if (typeof payload.output === 'string') return payload.output;
  if (typeof payload.text === 'string') return payload.text;
  if (typeof payload.content === 'string') return payload.content;
  if (typeof payload.result === 'string') return payload.result;

  if (payload?.result) {
    const nestedResult = parseAIResponse(payload.result);
    if (nestedResult) return nestedResult;
  }

  const outputText = parseTextBlocks(payload.output);
  if (outputText) return outputText;

  if (Array.isArray(payload.choices)) {
    const firstChoice = payload.choices[0];
    if (typeof firstChoice?.text === 'string') return firstChoice.text;
    if (typeof firstChoice?.message?.content === 'string') {
      return firstChoice.message.content;
    }

    const messageContentText = parseTextBlocks(firstChoice?.message?.content);
    if (messageContentText) return messageContentText;
  }

  return '';
};

const parseJsonOrText = async (response) => {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = AI_REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const parseGeminiResponse = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';

  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
};

export const fetchAdmissionsSnapshot = async (user = null) => {
  const [studentsRes, applicationsRes, coursesRes, paymentsRes] = await Promise.allSettled([
    API.get('/students'),
    API.get('/applications'),
    API.get('/courses'),
    API.get('/payments'),
  ]);

  const students = filterStudentsForUser(normalizeArray(studentsRes.value?.data), user);
  const applications = filterRecordsForUser(
    normalizeArray(applicationsRes.value?.data),
    user,
    (app) => app?.student
  );
  const courses = normalizeArray(coursesRes.value?.data);
  const payments = filterRecordsForUser(
    normalizeArray(paymentsRes.value?.data),
    user,
    (payment) => payment?.application?.student
  );

  const appStatus = applications.reduce((acc, app) => {
    const key = (app?.status || 'Unknown').toUpperCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const courseDemand = applications.reduce((acc, app) => {
    const name = app?.course?.courseName || 'Unknown Course';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const topCourses = Object.entries(courseDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, applicationsCount]) => ({ name, applicationsCount }));

  return {
    counts: {
      students: students.length,
      applications: applications.length,
      courses: courses.length,
      payments: payments.length,
    },
    applicationStatus: appStatus,
    topCourses,
    recentApplications: applications.slice(0, 10),
  };
};

const buildMessages = (prompt, snapshot) => {
  const system = [
    'You are an admissions operations AI assistant.',
    'Give practical recommendations for staff.',
    'Prefer concise bullet points and include clear next actions.',
  ].join(' ');

  const user = [
    `User request: ${prompt}`,
    'Admissions data snapshot:',
    JSON.stringify(snapshot, null, 2),
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
};

const buildFallbackResponse = (prompt, snapshot, options = {}) => {
  const approved = snapshot?.applicationStatus?.APPROVED || 0;
  const pending = snapshot?.applicationStatus?.PENDING || 0;
  const rejected = snapshot?.applicationStatus?.REJECTED || 0;
  const total = snapshot?.counts?.applications || 0;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const topCourse = snapshot?.topCourses?.[0];
  const intro = options.providerFailed
    ? `AI provider request failed, so this is a local insight summary for: "${prompt}".`
    : `AI provider is not configured, so this is a local insight summary for: "${prompt}".`;

  return [
    intro,
    '',
    `- Total applications: ${total}`,
    `- Approved: ${approved}`,
    `- Pending: ${pending}`,
    `- Rejected: ${rejected}`,
    `- Approval rate: ${approvalRate}%`,
    topCourse
      ? `- Highest-demand course: ${topCourse.name} (${topCourse.applicationsCount} applications)`
      : '- Highest-demand course: Not enough data',
    '',
    'Recommended next actions:',
    '- Review pending applications older than 7 days.',
    '- Balance officer workload around high-demand courses.',
    '- Send proactive notifications for incomplete submissions.',
  ].join('\n');
};

const requestViaProxy = async (prompt, snapshot) => {
  const response = await API.post(AI_PROXY_URL, {
    model: OPENAI_MODEL,
    prompt,
    context: snapshot,
    messages: buildMessages(prompt, snapshot),
  });

  const content = parseAIResponse(response?.data);
  if (!content) {
    throw new Error('AI proxy returned an unexpected response format.');
  }

  return content;
};

const requestViaOpenAI = async (prompt, snapshot) => {
  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.3,
      messages: buildMessages(prompt, snapshot),
    }),
  });

  const payload = await parseJsonOrText(response);
  if (!response.ok) {
    const apiMessage = (typeof payload === 'object' && payload?.error?.message)
      ? payload.error.message
      : (typeof payload === 'string' && payload.trim())
        ? payload.trim()
        : 'OpenAI request failed.';
    throw new Error(apiMessage);
  }

  const content = parseAIResponse(payload);
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  return content;
};

const requestViaGemini = async (prompt, snapshot) => {
  const messages = buildMessages(prompt, snapshot);
  const systemInstruction = messages.find((item) => item.role === 'system')?.content || '';
  const userContent = messages
    .filter((item) => item.role !== 'system')
    .map((item) => item.content)
    .join('\n\n');

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userContent }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    }
  );

  const payload = await parseJsonOrText(response);
  if (!response.ok) {
    const apiMessage = (typeof payload === 'object' && payload?.error?.message)
      ? payload.error.message
      : (typeof payload === 'string' && payload.trim())
        ? payload.trim()
        : 'Gemini request failed.';
    throw new Error(apiMessage);
  }

  const content = parseGeminiResponse(payload);
  if (!content) {
    throw new Error('Gemini returned an empty response.');
  }

  return content;
};

export const generateAIResponse = async ({ prompt, snapshot }) => {
  const trimmedPrompt = (prompt || '').trim();
  if (!trimmedPrompt) {
    throw new Error('Please enter a prompt.');
  }

  const providerErrors = [];
  let hadConfiguredProvider = false;

  const tryProvider = async (enabled, source, requestFn) => {
    if (!enabled) return null;
    hadConfiguredProvider = true;

    try {
      const text = await requestFn(trimmedPrompt, snapshot);
      return { text, source };
    } catch (error) {
      const message = error?.message || `${source} request failed`;
      providerErrors.push(`${source}: ${message}`);
      console.warn(`AI provider failed (${source})`, error);
      return null;
    }
  };

  const proxyResult = await tryProvider(AI_PROXY_URL, 'proxy', requestViaProxy);
  if (proxyResult) return proxyResult;

  const geminiResult = await tryProvider(GEMINI_API_KEY, 'gemini', requestViaGemini);
  if (geminiResult) return geminiResult;

  const openAIResult = await tryProvider(OPENAI_API_KEY, 'openai', requestViaOpenAI);
  if (openAIResult) return openAIResult;

  return {
    text: buildFallbackResponse(trimmedPrompt, snapshot, {
      providerFailed: hadConfiguredProvider,
    }),
    source: 'fallback',
    fallbackReason: hadConfiguredProvider ? 'provider_failed' : 'not_configured',
    providerErrors,
  };
};
