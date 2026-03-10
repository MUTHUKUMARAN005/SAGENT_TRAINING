const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, 'utf8');
  const out = {};

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    out[key] = value;
  });

  return out;
};

const envFile = parseEnvFile(envPath);
const getEnv = (name, fallback = '') =>
  String(process.env[name] || envFile[name] || fallback).trim();

const mask = (value) => {
  if (!value) return '(missing)';
  if (value.length <= 10) return '(set)';
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const isQuotaLike = (text) =>
  /quota|rate.?limit|billing|limit: 0|429/i.test(String(text || ''));

const checkLocalApp = async () => {
  try {
    const res = await fetch('http://localhost:3000/ai-assistant', {
      method: 'GET',
    });
    return {
      ok: res.ok,
      status: res.status,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
    };
  }
};

const checkGemini = async () => {
  const geminiKey = getEnv('REACT_APP_GEMINI_API_KEY');
  const geminiModel = getEnv('REACT_APP_GEMINI_MODEL', 'gemini-2.0-flash');

  if (!geminiKey) {
    return {
      enabled: false,
      ok: false,
      reason: 'REACT_APP_GEMINI_API_KEY is not set',
    };
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(
      geminiKey
    )}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Reply with OK only.' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8,
          temperature: 0,
        },
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        `Gemini request failed (${res.status})`;
      return {
        enabled: true,
        ok: false,
        status: res.status,
        reason: message,
        quotaLike: isQuotaLike(message),
      };
    }

    const reply =
      payload?.candidates?.[0]?.content?.parts
        ?.map((p) => (typeof p?.text === 'string' ? p.text : ''))
        .join(' ')
        .trim() || '';

    return {
      enabled: true,
      ok: true,
      status: res.status,
      reply,
    };
  } catch (error) {
    return {
      enabled: true,
      ok: false,
      status: 0,
      reason: error.message,
      networkError: true,
    };
  }
};

const main = async () => {
  const geminiKey = getEnv('REACT_APP_GEMINI_API_KEY');
  const openaiKey = getEnv('REACT_APP_OPENAI_API_KEY');
  const openaiProxy = getEnv('REACT_APP_OPENAI_PROXY_URL');
  const geminiModel = getEnv('REACT_APP_GEMINI_MODEL', 'gemini-2.0-flash');

  console.log('AI Assistant Self Check');
  console.log('=======================');
  console.log(`.env loaded: ${fs.existsSync(envPath) ? 'yes' : 'no'}`);
  console.log(`Gemini key: ${mask(geminiKey)}`);
  console.log(`Gemini model: ${geminiModel || '(missing)'}`);
  console.log(`OpenAI proxy: ${openaiProxy ? '(set)' : '(disabled)'}`);
  console.log(`OpenAI key: ${openaiKey ? '(set)' : '(disabled)'}`);

  const [localApp, gemini] = await Promise.all([checkLocalApp(), checkGemini()]);

  console.log('\nLocal app');
  console.log('--------');
  if (localApp.ok) {
    console.log(`PASS: http://localhost:3000/ai-assistant responded ${localApp.status}`);
  } else {
    console.log(
      `FAIL: local app check failed${localApp.status ? ` (${localApp.status})` : ''}${
        localApp.error ? ` - ${localApp.error}` : ''
      }`
    );
  }

  console.log('\nGemini API');
  console.log('----------');
  if (!gemini.enabled) {
    console.log(`SKIP: ${gemini.reason}`);
    process.exitCode = 1;
    return;
  }

  if (gemini.ok) {
    console.log(`PASS: Gemini responded ${gemini.status}`);
    console.log(`Reply: ${gemini.reply || '(empty text)'}`);
    return;
  }

  console.log(
    `FAIL: Gemini request failed${gemini.status ? ` (${gemini.status})` : ''}`
  );
  console.log(`Reason: ${gemini.reason}`);
  if (gemini.quotaLike) {
    console.log(
      'Diagnosis: This is a Gemini quota/billing/project access issue (not a frontend code issue).'
    );
  }
  process.exitCode = 1;
};

main().catch((error) => {
  console.error('Self-check crashed:', error.message);
  process.exit(1);
});

