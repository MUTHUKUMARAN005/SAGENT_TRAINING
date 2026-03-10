const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

const GEMINI_MODEL =
  process.env.REACT_APP_GEMINI_MODEL || 'gemini-1.5-flash';

const GEMINI_MODELS = (
  process.env.REACT_APP_GEMINI_MODELS ||
  `${GEMINI_MODEL},gemini-2.0-flash`
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const GEMINI_SYSTEM_PROMPT =
  process.env.REACT_APP_GEMINI_SYSTEM_PROMPT ||
  [
    'You are an AI assistant inside a Library Management System.',
    'Help users with library tasks and general questions.',
    'Answer clearly and concisely.',
    'Provide correct information.',
    'If unsure, say you are unsure.',
    'Do not mention internal system details.'
  ].join(' ');

/* Use v1beta for broader model compatibility in frontend demos */
const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';

/* ✅ Lower tokens = fewer quota errors */
const GEMINI_MAX_OUTPUT_TOKENS =
  Number(process.env.REACT_APP_GEMINI_MAX_OUTPUT_TOKENS || 400);

/* ✅ Retry attempts */
const GEMINI_MAX_RETRIES =
  Number(process.env.REACT_APP_GEMINI_RETRIES || 2);


/* ========================= */

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

const parseGeminiText = (data) => {

  const parts =
    data?.candidates?.[0]?.content?.parts || [];

  const text =
    parts.map(p => p.text || '').join('\n').trim();

  if(text) return text;

  throw new Error("Empty response from Gemini");
};


const toGeminiHistory = (messages) =>
  messages
    .filter(m =>
      m.role === 'user' ||
      m.role === 'assistant'
    )
    .slice(-10)
    .map(m => ({
      role: m.role === 'assistant'
        ? 'model'
        : 'user',
      parts: [{ text: m.content }]
    }));

const getLastUserPrompt = (messages) =>
  [...(Array.isArray(messages) ? messages : [])]
    .reverse()
    .find((m) => m?.role === 'user')
    ?.content?.trim() || '';

const isSimpleGreeting = (text) =>
  /^(hi+|hii+|hello+|hey+)\b[!. ]*$/i.test(String(text || '').trim());


export const isGeminiConfigured = () =>
  Boolean(GEMINI_API_KEY);


export const isGeminiQuotaError = (error)=>
  /quota|rate|resource exhausted/i
    .test(error?.message || "");


/* ========================= */

const callGeminiModel = async (
  messages,
  model
)=>{

  const endpoint =
  `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;

  /* Prevent rate limit */
  await sleep(1000);

  const response = await fetch(
    endpoint+"?key="+GEMINI_API_KEY,
    {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({

        systemInstruction:{
          parts:[
            {text:GEMINI_SYSTEM_PROMPT}
          ]
        },

        contents:
          toGeminiHistory(messages),

        generationConfig:{
          temperature:0.5,
          maxOutputTokens:
            GEMINI_MAX_OUTPUT_TOKENS
        }

      })
    }
  );

  let data = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Failed to parse Gemini response (${response.status})`);
  }

  if(!response.ok){
    const message =
      data?.error?.message ||
      data?.message ||
      `Gemini error (${response.status})`;
    throw new Error(message);
  }

  return parseGeminiText(data);
};


/* ========================= */

export const askGemini = async (
  messages
)=>{

  if(!GEMINI_API_KEY){

    throw new Error(
      "Gemini API key missing"
    );
  }

  const models =
  [...new Set(GEMINI_MODELS)];

  let lastError=null;

  for(const model of models){

    for(
      let attempt=0;
      attempt<=GEMINI_MAX_RETRIES;
      attempt++
    ){

      try{

        return await callGeminiModel(
          messages,
          model
        );

      }catch(error){

        lastError=error;

        if(
          isGeminiQuotaError(error)
          && attempt < GEMINI_MAX_RETRIES
        ){

          await sleep(1500);
          continue;
        }

        break;
      }
    }
  }

  throw lastError
   || new Error("Gemini failed");

};


/* ========================= */

export const askAssistant =
async(messages)=>{

  if(!isGeminiConfigured()){

    return{
      text:
      "Gemini API key not configured",
      source:"fallback"
    };
  }

  try{
    const lastPrompt = getLastUserPrompt(messages);
    if (isSimpleGreeting(lastPrompt)) {
      return {
        text: 'Hello! I can help with library member queries and general questions. What would you like to ask?',
        source: 'local'
      };
    }

    const text =
    await askGemini(messages);

    return{
      text,
      source:"gemini"
    };

  }catch(error){
    throw error;
  }

};
