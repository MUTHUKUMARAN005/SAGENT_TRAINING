const encode = (value = '') => encodeURIComponent(String(value));

const normalizeCampaignId = (campaign = {}) =>
  campaign?.campaign_id || campaign?.campaignId || campaign?.id || '';

export const getCampaignShareUrl = (campaign = {}) => {
  if (typeof window === 'undefined') return '';
  const id = normalizeCampaignId(campaign);
  return id ? `${window.location.origin}/campaigns/${id}` : window.location.href;
};

export const getCampaignShareText = (campaign = {}) => {
  const title = campaign?.title || 'this campaign';
  const ngoName = campaign?.ngo_name || campaign?.ngoName || 'a verified NGO';
  const raised = Number(campaign?.collected_amount || campaign?.collectedAmount || 0);
  const goal = Number(campaign?.target_amount || campaign?.targetAmount || 0);

  const progressText = goal > 0
    ? `Raised ₹${raised.toLocaleString('en-IN')} of ₹${goal.toLocaleString('en-IN')}.`
    : `Support ${ngoName} on KindWave.`;

  return `Support "${title}" by ${ngoName} on KindWave. ${progressText}`;
};

export const getCampaignSharePayload = (campaign = {}) => {
  const text = getCampaignShareText(campaign);
  const url = getCampaignShareUrl(campaign);

  return {
    title: campaign?.title || 'KindWave Campaign',
    text,
    url,
    combinedText: `${text} ${url}`.trim(),
  };
};

export const getPlatformShareUrl = (platform, campaign = {}) => {
  const { text, url } = getCampaignSharePayload(campaign);

  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encode(`${text} ${url}`)}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encode(text)}&url=${encode(url)}`;
    case 'instagram':
      return 'https://www.instagram.com/';
    default:
      return url;
  }
};

export const shareCampaignNatively = async (campaign = {}) => {
  if (typeof window === 'undefined') return { success: false, mode: 'unsupported' };

  const payload = getCampaignSharePayload(campaign);
  try {
    if (navigator.share) {
      await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
      return { success: true, mode: 'native' };
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload.combinedText);
      return { success: true, mode: 'clipboard', payload };
    }

    return { success: false, mode: 'unsupported', payload };
  } catch (error) {
    return { success: false, mode: 'cancelled', error, payload };
  }
};

export const prepareInstagramShare = async (campaign = {}) => {
  const payload = getCampaignSharePayload(campaign);

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload.combinedText);
  }

  return {
    url: getPlatformShareUrl('instagram', campaign),
    payload,
  };
};

