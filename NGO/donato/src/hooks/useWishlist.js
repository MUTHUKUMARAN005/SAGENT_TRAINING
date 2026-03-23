import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const STORAGE_PREFIX = 'kindwave_wishlist_';

const parseCampaignId = (campaign) =>
  Number(campaign?.campaign_id ?? campaign?.campaignId ?? campaign?.id ?? 0);

const normalizeWishlistItem = (campaign = {}) => ({
  campaign_id: parseCampaignId(campaign),
  title: campaign?.title || 'Campaign',
  image: campaign?.image || '',
  ngo_name: campaign?.ngo_name || campaign?.ngoName || 'Verified NGO',
  target_amount: Number(campaign?.target_amount ?? campaign?.targetAmount ?? 0),
  collected_amount: Number(campaign?.collected_amount ?? campaign?.collectedAmount ?? 0),
  donation_type: String(campaign?.donation_type || campaign?.donationType || 'money').toLowerCase(),
  end_date: campaign?.end_date || campaign?.endDate || null,
  added_at: new Date().toISOString(),
});

const safeArray = (value) => (Array.isArray(value) ? value : []);

export const useWishlist = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const storageKey = useMemo(() => {
    const userId = user?.user_id ?? user?.id ?? 'guest';
    return `${STORAGE_PREFIX}${userId}`;
  }, [user?.id, user?.user_id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(safeArray(parsed).filter((item) => Number(item?.campaign_id) > 0));
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  const persist = useCallback(
    (nextItems) => {
      const clean = safeArray(nextItems).filter((item) => Number(item?.campaign_id) > 0);
      setItems(clean);
      localStorage.setItem(storageKey, JSON.stringify(clean));
      return clean;
    },
    [storageKey]
  );

  const isWishlisted = useCallback(
    (campaignId) => items.some((item) => Number(item.campaign_id) === Number(campaignId)),
    [items]
  );

  const toggleWishlist = useCallback(
    (campaign) => {
      const campaignId = parseCampaignId(campaign);
      if (!campaignId) return { added: false, items };

      const exists = items.some((item) => Number(item.campaign_id) === campaignId);
      const next = exists
        ? items.filter((item) => Number(item.campaign_id) !== campaignId)
        : [...items, normalizeWishlistItem(campaign)];

      persist(next);
      return { added: !exists, items: next };
    },
    [items, persist]
  );

  const removeFromWishlist = useCallback(
    (campaignId) => {
      const next = items.filter((item) => Number(item.campaign_id) !== Number(campaignId));
      persist(next);
      return next;
    },
    [items, persist]
  );

  return {
    wishlistItems: items,
    wishlistCount: items.length,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
  };
};


