const IMPACT_RULES = {
  food: {
    unitCost: 50,
    singularLabel: 'child',
    unitLabel: 'children',
    verb: 'helped feed',
    noun: 'meals served',
    icon: '🍲',
  },
  education: {
    unitCost: 250,
    singularLabel: 'child',
    unitLabel: 'children',
    verb: 'helped educate',
    noun: 'study kits funded',
    icon: '📚',
  },
  medicine: {
    unitCost: 300,
    singularLabel: 'patient',
    unitLabel: 'patients',
    verb: 'helped support',
    noun: 'medical kits funded',
    icon: '💊',
  },
  healthcare: {
    unitCost: 350,
    singularLabel: 'patient',
    unitLabel: 'patients',
    verb: 'helped care for',
    noun: 'healthcare visits supported',
    icon: '🏥',
  },
  clothes: {
    unitCost: 400,
    singularLabel: 'family',
    unitLabel: 'families',
    verb: 'helped clothe',
    noun: 'winter kits donated',
    icon: '👕',
  },
  water: {
    unitCost: 100,
    singularLabel: 'family',
    unitLabel: 'families',
    verb: 'helped provide clean water to',
    noun: 'days of clean water funded',
    icon: '💧',
  },
  disaster_relief: {
    unitCost: 500,
    singularLabel: 'family',
    unitLabel: 'families',
    verb: 'helped support',
    noun: 'relief kits funded',
    icon: '🆘',
  },
  women: {
    unitCost: 300,
    singularLabel: 'woman',
    unitLabel: 'women',
    verb: 'helped empower',
    noun: 'support kits funded',
    icon: '👩',
  },
  children: {
    unitCost: 150,
    singularLabel: 'child',
    unitLabel: 'children',
    verb: 'helped support',
    noun: 'child-care essentials funded',
    icon: '👶',
  },
  rural: {
    unitCost: 500,
    singularLabel: 'villager',
    unitLabel: 'villagers',
    verb: 'helped reach',
    noun: 'community support packs funded',
    icon: '🏘️',
  },
  environment: {
    unitCost: 100,
    singularLabel: 'tree',
    unitLabel: 'trees',
    verb: 'helped plant',
    noun: 'trees sponsored',
    icon: '🌿',
  },
  money: {
    unitCost: 500,
    singularLabel: 'family',
    unitLabel: 'families',
    verb: 'helped support',
    noun: 'family support packs funded',
    icon: '❤️',
  },
  other: {
    unitCost: 500,
    singularLabel: 'family',
    unitLabel: 'families',
    verb: 'helped support',
    noun: 'community support packs funded',
    icon: '🤝',
  },
};

const KEYWORD_RULES = [
  { match: ['feed', 'food', 'meal', 'hunger'], rule: 'food' },
  { match: ['educat', 'school', 'book', 'student'], rule: 'education' },
  { match: ['medical', 'health', 'hospital', 'medicine'], rule: 'healthcare' },
  { match: ['water', 'sanitation'], rule: 'water' },
  { match: ['relief', 'flood', 'disaster', 'emergency'], rule: 'disaster_relief' },
  { match: ['cloth', 'winter'], rule: 'clothes' },
  { match: ['women', 'girl'], rule: 'women' },
  { match: ['child', 'children'], rule: 'children' },
  { match: ['rural', 'village'], rule: 'rural' },
  { match: ['tree', 'environment', 'green'], rule: 'environment' },
];

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const getCampaignText = (campaign = {}) =>
  `${campaign?.title || ''} ${campaign?.description || ''}`.toLowerCase();

export const inferImpactCategory = (campaign = {}, donationType = 'money') => {
  const normalizedType = String(
    donationType || campaign?.donation_type || campaign?.donationType || 'money'
  )
    .toLowerCase()
    .trim();

  if (IMPACT_RULES[normalizedType]) {
    return normalizedType;
  }

  const haystack = getCampaignText(campaign);
  const keywordMatch = KEYWORD_RULES.find(({ match }) =>
    match.some((token) => haystack.includes(token))
  );

  return keywordMatch?.rule || 'money';
};

export const getDonationImpact = ({ amount = 0, donationType = 'money', campaign = {} } = {}) => {
  const numericAmount = Number(amount || 0);
  const category = inferImpactCategory(campaign, donationType);
  const rule = IMPACT_RULES[category] || IMPACT_RULES.money;
  const units = Math.max(1, Math.floor(numericAmount / rule.unitCost || 0));
  const amountLabel = formatCurrency(numericAmount);
  const targetLabel = units === 1 ? rule.singularLabel || rule.unitLabel : rule.unitLabel;

  return {
    category,
    icon: rule.icon,
    unitCost: rule.unitCost,
    units,
    noun: rule.noun,
    headline: `${amountLabel} donation ${rule.verb} ${units} ${targetLabel}.`,
    shortHeadline: `Your ${amountLabel} donation ${rule.verb} ${units} ${targetLabel}.`,
    detail: `Estimated impact based on this campaign's donation type and current support model.`,
    statLabel: `${units} ${targetLabel}`,
    meta: `${formatCurrency(rule.unitCost)} ≈ 1 ${rule.singularLabel || targetLabel}`,
  };
};

