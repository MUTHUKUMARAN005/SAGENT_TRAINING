import { APP_CONFIG, CHATBOT_RESPONSES } from './constants.js';
import { getDashboardPathByRole, USER_ROLES } from './roles.js';

const ROLE_GUIDANCE = {
  admin:
    'Admin can access platform-wide controls: user management, campaign moderation, donation analytics, and reports.',
  ngo:
    'NGO role can create/manage campaigns, track incoming donations, and coordinate volunteers for campaigns.',
  donor:
    'Donor role can donate to campaigns, view donation history, and download receipts from dashboard.',
  volunteer:
    'Volunteer role can view opportunities, manage assigned tasks, and track schedule/activity from dashboard.',
  guest:
    'Guest users can browse campaigns and map. Sign in to use dashboard and role-specific actions.',
};

const INTENT_RULES = [
  { intent: 'donate', patterns: [/\bdonat(e|ion|ing)?\b/, /\bpay(ment)?\b/, /\bupi\b/, /\bcard\b/, /\bbank\b/, /\bcontribut(e|ion)\b/] },
  { intent: 'campaigns', patterns: [/\bcampaign(s)?\b/, /\bcause(s)?\b/, /\bfundraiser\b/, /\bactive campaign\b/] },
  { intent: 'receipt', patterns: [/\breceipt(s)?\b/, /\b80g\b/, /\btax\b/, /\btransaction\b/, /\binvoice\b/] },
  { intent: 'pickup', patterns: [/\bpickup\b/, /\bcollect(ion)?\b/, /\bphysical donation\b/, /\bclothes\b/, /\bbooks\b/, /\bfood donation\b/] },
  { intent: 'volunteer', patterns: [/\bvolunteer(ing)?\b/, /\bhelp\b/, /\bopportunit(y|ies)\b/, /\btask(s)?\b/] },
  { intent: 'ngo', patterns: [/\bngo\b/, /\borganization\b/, /\bcharit(y|able)\b/, /\bregister ngo\b/] },
  { intent: 'map', patterns: [/\bmap\b/, /\bnear me\b/, /\blocation\b/, /\bnearby\b/, /\bfind ngo\b/] },
  { intent: 'track', patterns: [/\btrack\b/, /\bhistory\b/, /\bstatus\b/, /\bdashboard\b/, /\bmy donation(s)?\b/] },
];

const normalizeText = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizeChatRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (Object.values(USER_ROLES).includes(normalized)) return normalized;
  return 'guest';
};

const findMentionedRole = (text) => {
  if (/\badmin\b/.test(text)) return 'admin';
  if (/\bngo\b/.test(text)) return 'ngo';
  if (/\bdonor\b/.test(text)) return 'donor';
  if (/\bvolunteer\b/.test(text)) return 'volunteer';
  return null;
};

const roleFooter = (role) => {
  if (role === 'guest') return 'Sign in to access your role dashboard.';
  return `Your role dashboard route: ${getDashboardPathByRole(role)}.`;
};

const getIntentResponse = (intent, role) => {
  switch (intent) {
    case 'donate':
      return (
        `${CHATBOT_RESPONSES.donate}\n\n` +
        `Quick steps: 1) Open Campaigns 2) Select a campaign 3) Click Donate Now 4) Choose UPI/Card/Bank 5) Download receipt.\n\n` +
        roleFooter(role)
      );
    case 'campaigns':
      return (
        `${CHATBOT_RESPONSES.campaigns}\n\n` +
        `Tip: Use filters on Campaigns to narrow by category, status, and location.`
      );
    case 'receipt':
      return (
        `${CHATBOT_RESPONSES.receipt}\n\n` +
        `If needed, open Receipt page and search by receipt/transaction details.`
      );
    case 'pickup':
      return (
        `${CHATBOT_RESPONSES.pickup}\n\n` +
        `Quick steps: Donate page -> choose physical donation -> pin location -> pick date/time -> confirm pickup.`
      );
    case 'volunteer':
      return (
        `${CHATBOT_RESPONSES.volunteer}\n\n` +
        `Volunteer features are available from ${getDashboardPathByRole('volunteer')}.`
      );
    case 'ngo':
      return (
        `${CHATBOT_RESPONSES.ngo}\n\n` +
        `NGO dashboard route: ${getDashboardPathByRole('ngo')}.`
      );
    case 'map':
      return (
        `${CHATBOT_RESPONSES.map}\n\n` +
        `You can view NGOs, campaigns, and pickup centers with filters on the Map page.`
      );
    case 'track':
      return (
        `${CHATBOT_RESPONSES.track}\n\n` +
        roleFooter(role)
      );
    default:
      return CHATBOT_RESPONSES.default;
  }
};

const getRoleResponse = (askedRole, currentRole) => {
  const targetRole = askedRole || currentRole;
  const guidance = ROLE_GUIDANCE[targetRole] || CHATBOT_RESPONSES.default;
  const accessLine =
    currentRole === targetRole
      ? `You are currently signed in as ${currentRole}.`
      : `You are currently signed in as ${currentRole}.`;

  const routeLine = targetRole === 'guest'
    ? 'Dashboard access is available after sign in.'
    : `Dashboard route for ${targetRole}: ${getDashboardPathByRole(targetRole)}.`;

  return `${guidance}\n\n${accessLine}\n${routeLine}`;
};

export const getSmartFallbackResponse = (message, role = 'guest') => {
  const text = normalizeText(message);
  const currentRole = normalizeChatRole(role);

  if (!text) return CHATBOT_RESPONSES.default;

  if (/\b(hi|hello|hey|hola)\b/.test(text)) return CHATBOT_RESPONSES.greeting;
  if (/\b(thank you|thanks|thx)\b/.test(text)) {
    return "You're welcome. Ask me about role permissions, dashboard access, donations, receipts, map, or pickup scheduling.";
  }
  if (/\b(contact|support|email|phone|help center)\b/.test(text)) {
    return `You can reach support at ${APP_CONFIG.email} or ${APP_CONFIG.phone}.`;
  }

  if (/\b(role|permission|access|can i|what can|dashboard)\b/.test(text)) {
    const askedRole = findMentionedRole(text);
    if (askedRole) return getRoleResponse(askedRole, currentRole);
    return getRoleResponse(currentRole, currentRole);
  }

  let bestIntent = null;
  let bestScore = 0;

  for (const rule of INTENT_RULES) {
    const score = rule.patterns.reduce((acc, pattern) => acc + (pattern.test(text) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = rule.intent;
    }
  }

  if (!bestIntent || bestScore === 0) {
    return CHATBOT_RESPONSES.default;
  }

  return getIntentResponse(bestIntent, currentRole);
};
