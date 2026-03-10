process.env.NODE_ENV = 'development';
process.env.BABEL_ENV = 'development';

const getClientEnvironment = require('react-scripts/config/env');
const env = getClientEnvironment('');

const key = (env.raw && env.raw.REACT_APP_OPENAI_API_KEY) || '';
const proxy = (env.raw && env.raw.REACT_APP_OPENAI_PROXY_URL) || '';

console.log(
  JSON.stringify(
    {
      hasOpenAIKey: Boolean(key),
      openAIKeyLength: key.length,
      hasProxyUrl: Boolean(proxy),
      openAIPrefix: key ? key.slice(0, 7) : '',
      openAISuffix: key ? key.slice(-4) : '',
      openAIKeysLoaded: Object.keys(env.raw || {}).filter((k) =>
        k.includes('OPENAI')
      ),
    },
    null,
    2
  )
);
