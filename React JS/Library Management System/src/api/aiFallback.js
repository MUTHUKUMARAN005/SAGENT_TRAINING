const normalize = (value) => (value || '').toLowerCase();

const getLastUserPrompt = (messages) => {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  return lastUser?.content?.trim() || '';
};

const buildOverdueReminder = () =>
  [
    'Subject: Friendly Reminder: Library Item Due Date',
    '',
    'Hello,',
    '',
    'This is a friendly reminder that one or more borrowed library items may be due (or overdue).',
    'Please return or renew them at your earliest convenience to avoid additional fines.',
    '',
    'If you have already returned the item, please ignore this message.',
    '',
    'Thank you,',
    'Library Team'
  ].join('\n');

const buildBookSuggestions = () =>
  [
    'Here are 5 beginner-friendly personal finance books:',
    '1. The Psychology of Money - Morgan Housel',
    '2. I Will Teach You to Be Rich - Ramit Sethi',
    '3. The Simple Path to Wealth - JL Collins',
    '4. Your Money or Your Life - Vicki Robin & Joe Dominguez',
    '5. The Total Money Makeover - Dave Ramsey',
    '',
    'If you want, ask for recommendations based on your age, income, or country.'
  ].join('\n');

const buildFictionVsNonFiction = () =>
  [
    'Fiction = stories created from imagination (novels, short stories).',
    'Non-fiction = books based on real facts, events, or information (biographies, history, science).',
    '',
    'Quick example:',
    '- Fiction: a mystery novel',
    '- Non-fiction: a book about real criminal investigations'
  ].join('\n');

const buildSummaryHelp = () =>
  [
    'Paste the book text, chapter, or a description, and I can summarize it in simple language.',
    'You can also tell me the target level (child, student, beginner, professional).'
  ].join('\n');

export const generateFallbackAssistantReply = (messages, reason = 'Gemini unavailable') => {
  const prompt = getLastUserPrompt(messages);
  const text = normalize(prompt);

  let response;

  if (text.includes('overdue') && (text.includes('message') || text.includes('reminder'))) {
    response = buildOverdueReminder();
  } else if (text.includes('personal finance') && (text.includes('book') || text.includes('suggest'))) {
    response = buildBookSuggestions();
  } else if (text.includes('fiction') && text.includes('non-fiction')) {
    response = buildFictionVsNonFiction();
  } else if (text.includes('summarize') || text.includes('summary')) {
    response = buildSummaryHelp();
  } else {
    response = [
      'Gemini is temporarily unavailable, so I am using a local fallback response.',
      '',
      'I can still help with:',
      '- library notices and reminder templates',
      '- simple explanations',
      '- formatting text',
      '- request/message drafting',
      '',
      'Ask a specific question and I will help as much as possible.'
    ].join('\n');
  }

  return {
    text: response,
    source: 'fallback',
    warning: reason
  };
};
