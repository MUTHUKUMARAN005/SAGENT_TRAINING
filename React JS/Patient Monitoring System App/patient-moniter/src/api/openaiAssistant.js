const DEFAULT_GEMINI_MODEL = process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.0-flash';
const MAX_OUTPUT_TOKENS = 420;

const buildSystemPrompt = (user) => {
  const role = String(user?.role || 'USER').toUpperCase();
  return [
    'You are an AI assistant inside a healthcare patient monitoring application.',
    'Be helpful, concise, and structured.',
    'Do not claim to be a doctor or provide diagnosis.',
    'For emergency symptoms, tell the user to seek urgent medical care immediately.',
    'Include a short safety note for health-related information.',
    `Current app user role: ${role}.`,
  ].join(' ');
};

const normalizeMessagesForGemini = (messages = []) =>
  messages
    .filter(
      (message) =>
        (message?.role === 'user' || message?.role === 'assistant') &&
        typeof message?.content === 'string' &&
        message.content.trim()
    )
    .slice(-8)
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(message.content) }],
    }));

const extractTextFromGeminiResponse = (payload = {}) => {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n\n')
      .trim();
    if (text) return text;
  }

  return '';
};

export const sendAssistantMessage = async ({ messages, user }) => {
  const geminiApiKey = String(process.env.REACT_APP_GEMINI_API_KEY || '').trim();
  const geminiModel = process.env.REACT_APP_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (!geminiApiKey) {
    throw new Error('Missing Gemini configuration. Set REACT_APP_GEMINI_API_KEY in .env.');
  }

  const geminiEndpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(
      geminiApiKey
    )}`;

  const response = await fetch(geminiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(user) }],
      },
      contents: normalizeMessagesForGemini(messages),
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || `Gemini request failed (${response.status})`
    );
  }

  const reply = extractTextFromGeminiResponse(payload);
  if (!reply) {
    throw new Error('Gemini returned an empty response');
  }

  return reply;
};
