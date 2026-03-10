const GEMINI_MODEL = process.env.REACT_APP_GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_BASE_URL =
  process.env.REACT_APP_GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_KEY_STORAGE = 'freshmart_gemini_api_key';

const ASSISTANT_INSTRUCTION = `
You are FreshMart AI Assistant inside an ecommerce web app.
Answer user questions clearly and concisely.
You can answer general questions too, not only shopping questions.
If the user asks for app-specific actions you cannot perform, explain the limitation and suggest the next step.
`.trim();

const toGeminiContent = (message) => ({
  role: message.role,
  parts: [{ text: message.text }],
});

const extractGeminiText = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => part?.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (text) return text;

  const blockReason = payload?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Response blocked by Gemini: ${blockReason}`);
  }

  throw new Error('Gemini returned an empty response.');
};

export const getGeminiApiKey = () => {
  const envKey = (process.env.REACT_APP_GEMINI_API_KEY || '').trim();
  if (envKey) return envKey;

  if (typeof window === 'undefined') return '';
  return (window.localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim();
};

export const setGeminiApiKey = (key) => {
  if (typeof window === 'undefined') return;
  const value = (key || '').trim();
  if (value) {
    window.localStorage.setItem(GEMINI_KEY_STORAGE, value);
    return;
  }
  window.localStorage.removeItem(GEMINI_KEY_STORAGE);
};

export const isGeminiConfigured = () => Boolean(getGeminiApiKey());

export const askGemini = async (prompt, history = []) => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key missing. Set REACT_APP_GEMINI_API_KEY in .env and restart, or save a key in the assistant.'
    );
  }

  const safeHistory = Array.isArray(history)
    ? history.filter(
        (item) =>
          item &&
          (item.role === 'user' || item.role === 'model') &&
          typeof item.text === 'string' &&
          item.text.trim()
      )
    : [];

  while (safeHistory.length && safeHistory[0].role !== 'user') {
    safeHistory.shift();
  }

  let response;
  try {
    response = await fetch(
      `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            role: 'system',
            parts: [{ text: ASSISTANT_INSTRUCTION }],
          },
          contents: [
            ...safeHistory.map(toGeminiContent),
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );
  } catch (error) {
    throw new Error(
      'AI assistant frontend request failed. Check internet access, API key validity, and browser/network restrictions.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || `Gemini request failed (${response.status})`;
    throw new Error(message);
  }

  return extractGeminiText(data);
};
